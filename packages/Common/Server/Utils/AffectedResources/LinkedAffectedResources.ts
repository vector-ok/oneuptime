import DatabaseConfig from "../../DatabaseConfig";
import AlertService from "../../Services/AlertService";
import DatabaseService from "../../Services/DatabaseService";
import IncidentService from "../../Services/IncidentService";
import MonitorService from "../../Services/MonitorService";
import ScheduledMaintenanceService from "../../Services/ScheduledMaintenanceService";
import Query from "../../Types/Database/Query";
import QueryHelper from "../../Types/Database/QueryHelper";
import Select from "../../Types/Database/Select";
import DatabaseBaseModel from "../../../Models/DatabaseModels/DatabaseBaseModel/DatabaseBaseModel";
import URL from "../../../Types/API/URL";
import ObjectID from "../../../Types/ObjectID";
import { escapeMarkdownInline } from "../../../Utils/Markdown/MarkdownEscape";
import {
  getSloAffectedResourceMarkdownLines,
  SloAffectedResourceLinkSubject,
} from "../../../Utils/Slo/SloAffectedResourceMarkdown";

/*
 * What an incident, alert or scheduled maintenance event affects, for the
 * text the server writes about it: the "Resources Affected" section of its
 * feed items, the Resources Affected row of its emails, and the workspace
 * summaries.
 *
 * The dashboard's Affected Resources cards (AffectedResourcesDisplay) list
 * every relation the record carries - monitors, hosts, clusters, container
 * hosts, databases, services, SLOs. The server used to name the monitors
 * only, so an SLO burn-rate alert's card named its SLO while its on-call
 * email read "Resources Affected: No resources identified", and an incident
 * raised against a host named nothing at all. Every one of those writers now
 * reads the list from here, so they name what the cards show.
 *
 * Reads run as root - an owner or on-call email has no user session behind
 * it - and are held to the record's own project twice: the record is only
 * read inside that project, and a related row of any other project is left
 * out. The write hooks reject cross-project links now, but rows saved before
 * that check existed may still hold one, and naming it would put another
 * project's resource into this project's feed, Slack and email.
 */

export enum LinkedAffectedResourceType {
  Monitor = "Monitor",
  Host = "Host",
  KubernetesCluster = "KubernetesCluster",
  DockerHost = "DockerHost",
  PodmanHost = "PodmanHost",
  ProxmoxCluster = "ProxmoxCluster",
  VMwareVCenter = "VMwareVCenter",
  CephCluster = "CephCluster",
  DockerSwarmCluster = "DockerSwarmCluster",
  IoTFleet = "IoTFleet",
  DatabaseServer = "DatabaseServer",
  NetworkSite = "NetworkSite",
  Service = "Service",
  ServiceLevelObjective = "ServiceLevelObjective",
}

export interface LinkedAffectedResource {
  type: LinkedAffectedResourceType;
  id: string;
  name: string;
}

export interface LinkedAffectedResourceRelation {
  // The relation column on Incident / Alert / ScheduledMaintenance.
  column: string;
  type: LinkedAffectedResourceType;
  // Leads the feed bullet, e.g. "[Host web-01](...)".
  label: string;
  // The dashboard route after `/<projectId>/`, ending just before the id.
  dashboardRoute: string;
}

/*
 * The categories AffectedResourcesDisplay renders, in the order it renders
 * them, so a feed item lists resources the way the cards beside it do. The
 * routes are the ones each resource's own getXLinkInDashboard builds (a test
 * pins every one that exists); IoT fleets and network sites have none on the
 * server, so theirs follow the dashboard's RouteMap.
 *
 * Only strings: this table is read at module load, and the services these
 * resources belong to sit in an import graph that loops back here (see
 * AffectedResourceRelations).
 *
 * An alert has a single `monitor`; incidents and scheduled maintenance events
 * have `monitors`. Each record kind is read for the columns its model has.
 */
export const LINKED_AFFECTED_RESOURCE_RELATIONS: ReadonlyArray<LinkedAffectedResourceRelation> =
  [
    {
      column: "monitors",
      type: LinkedAffectedResourceType.Monitor,
      label: "Monitor",
      dashboardRoute: "monitors",
    },
    {
      column: "monitor",
      type: LinkedAffectedResourceType.Monitor,
      label: "Monitor",
      dashboardRoute: "monitors",
    },
    {
      column: "hosts",
      type: LinkedAffectedResourceType.Host,
      label: "Host",
      dashboardRoute: "host",
    },
    {
      column: "kubernetesClusters",
      type: LinkedAffectedResourceType.KubernetesCluster,
      label: "Kubernetes Cluster",
      dashboardRoute: "kubernetes",
    },
    {
      column: "dockerHosts",
      type: LinkedAffectedResourceType.DockerHost,
      label: "Docker Host",
      dashboardRoute: "docker",
    },
    {
      column: "podmanHosts",
      type: LinkedAffectedResourceType.PodmanHost,
      label: "Podman Host",
      dashboardRoute: "podman",
    },
    {
      column: "proxmoxClusters",
      type: LinkedAffectedResourceType.ProxmoxCluster,
      label: "Proxmox Cluster",
      dashboardRoute: "proxmox",
    },
    {
      column: "vmwareVCenters",
      type: LinkedAffectedResourceType.VMwareVCenter,
      label: "VMware vCenter",
      dashboardRoute: "vmware",
    },
    {
      column: "cephClusters",
      type: LinkedAffectedResourceType.CephCluster,
      label: "Ceph Cluster",
      dashboardRoute: "ceph",
    },
    {
      column: "dockerSwarmClusters",
      type: LinkedAffectedResourceType.DockerSwarmCluster,
      label: "Docker Swarm Cluster",
      dashboardRoute: "docker-swarm",
    },
    {
      column: "iotFleets",
      type: LinkedAffectedResourceType.IoTFleet,
      label: "IoT Fleet",
      dashboardRoute: "iot",
    },
    {
      column: "databaseServers",
      type: LinkedAffectedResourceType.DatabaseServer,
      label: "Database",
      dashboardRoute: "databases",
    },
    {
      column: "networkSites",
      type: LinkedAffectedResourceType.NetworkSite,
      label: "Network Site",
      dashboardRoute: "network-sites/view",
    },
    {
      column: "services",
      type: LinkedAffectedResourceType.Service,
      label: "Service",
      dashboardRoute: "service",
    },
    /*
     * Last, as on the cards: an SLO is the objective measured over the
     * resources above it rather than one of them.
     */
    {
      column: "serviceLevelObjectives",
      type: LinkedAffectedResourceType.ServiceLevelObjective,
      label: "SLO",
      dashboardRoute: "slos",
    },
  ];

// Structural, so a model instance and a plain relation row both fit.
interface RelatedRow {
  _id?: string | ObjectID | undefined | null;
  name?: string | undefined | null;
  projectId?: ObjectID | string | undefined | null;
}

type RecordWithRelations = {
  projectId?: ObjectID | string | undefined | null;
} & Partial<Record<string, unknown>>;

function isSameProject(
  projectId: ObjectID | string | undefined | null,
  expected: ObjectID,
): boolean {
  if (!projectId) {
    return false;
  }

  return (
    projectId.toString().trim().toLowerCase() ===
    expected.toString().trim().toLowerCase()
  );
}

export default class LinkedAffectedResources {
  // The relations `model` carries, in display order.
  public static getRelations(
    model: DatabaseBaseModel,
  ): Array<LinkedAffectedResourceRelation> {
    return LINKED_AFFECTED_RESOURCE_RELATIONS.filter(
      (relation: LinkedAffectedResourceRelation) => {
        return model.hasColumn(relation.column);
      },
    );
  }

  public static async readForIncident(data: {
    projectId: ObjectID;
    incidentId: ObjectID;
  }): Promise<Array<LinkedAffectedResource>> {
    return await LinkedAffectedResources.readForIncidents({
      projectId: data.projectId,
      incidentIds: [data.incidentId],
    });
  }

  public static async readForIncidents(data: {
    projectId: ObjectID;
    incidentIds: Array<ObjectID>;
  }): Promise<Array<LinkedAffectedResource>> {
    return await LinkedAffectedResources.read({
      service: IncidentService,
      projectId: data.projectId,
      recordIds: data.incidentIds,
    });
  }

  public static async readForAlert(data: {
    projectId: ObjectID;
    alertId: ObjectID;
  }): Promise<Array<LinkedAffectedResource>> {
    return await LinkedAffectedResources.readForAlerts({
      projectId: data.projectId,
      alertIds: [data.alertId],
    });
  }

  public static async readForAlerts(data: {
    projectId: ObjectID;
    alertIds: Array<ObjectID>;
  }): Promise<Array<LinkedAffectedResource>> {
    return await LinkedAffectedResources.read({
      service: AlertService,
      projectId: data.projectId,
      recordIds: data.alertIds,
    });
  }

  public static async readForScheduledMaintenance(data: {
    projectId: ObjectID;
    scheduledMaintenanceId: ObjectID;
  }): Promise<Array<LinkedAffectedResource>> {
    return await LinkedAffectedResources.read({
      service: ScheduledMaintenanceService,
      projectId: data.projectId,
      recordIds: [data.scheduledMaintenanceId],
    });
  }

  /*
   * The resources linked to any of `recordIds`, merged into one list.
   *
   * One query per relation rather than one query selecting them all: the
   * relations are many-to-many, and joining a dozen of them at once returns
   * the product of their sizes - an incident on 50 monitors and 50 hosts
   * would come back as 2,500 rows. Read one at a time, the rows add up.
   */
  private static async read<TBaseModel extends DatabaseBaseModel>(data: {
    service: DatabaseService<TBaseModel>;
    projectId: ObjectID;
    recordIds: Array<ObjectID>;
  }): Promise<Array<LinkedAffectedResource>> {
    const recordIds: Array<ObjectID> = [];
    const seenRecordIds: Set<string> = new Set<string>();

    for (const recordId of data.recordIds) {
      const key: string = recordId?.toString() || "";

      if (!key || seenRecordIds.has(key)) {
        continue;
      }

      seenRecordIds.add(key);
      recordIds.push(recordId);
    }

    if (recordIds.length === 0) {
      return [];
    }

    const relations: Array<LinkedAffectedResourceRelation> =
      LinkedAffectedResources.getRelations(data.service.getModel());

    const rowsPerRelation: Array<Array<TBaseModel>> = await Promise.all(
      relations.map(
        (
          relation: LinkedAffectedResourceRelation,
        ): Promise<Array<TBaseModel>> => {
          return data.service.findAllBy({
            query: {
              _id: QueryHelper.any(recordIds),
              projectId: data.projectId,
            } as unknown as Query<TBaseModel>,
            select: {
              _id: true,
              projectId: true,
              [relation.column]: {
                _id: true,
                name: true,
                projectId: true,
              },
            } as unknown as Select<TBaseModel>,
            props: {
              isRoot: true,
            },
          });
        },
      ),
    );

    return LinkedAffectedResources.collect({
      projectId: data.projectId,
      records: rowsPerRelation.flat() as unknown as Array<RecordWithRelations>,
    });
  }

  /*
   * The resources on already-read records, in display order and without
   * repeats. A related row is kept only when it has an id and belongs to
   * `projectId`; a row whose project was not read cannot be shown to belong
   * here, so it is left out too - which also makes a caller that drops
   * projectId from its select fail loudly in tests rather than quietly
   * print nothing.
   */
  public static collect(data: {
    projectId: ObjectID;
    records: Array<RecordWithRelations | null | undefined>;
  }): Array<LinkedAffectedResource> {
    const resources: Array<LinkedAffectedResource> = [];
    const seen: Set<string> = new Set<string>();

    const records: Array<RecordWithRelations> = data.records.filter(
      (record: RecordWithRelations | null | undefined): boolean => {
        if (!record) {
          return false;
        }

        // A record read without its project is taken to be the caller's.
        return (
          !record.projectId || isSameProject(record.projectId, data.projectId)
        );
      },
    ) as Array<RecordWithRelations>;

    for (const relation of LINKED_AFFECTED_RESOURCE_RELATIONS) {
      for (const record of records) {
        const value: unknown = record[relation.column];

        const rows: Array<RelatedRow | null | undefined> = Array.isArray(value)
          ? (value as Array<RelatedRow | null | undefined>)
          : value
            ? [value as RelatedRow]
            : [];

        for (const row of rows) {
          const id: string = row?._id?.toString() || "";

          if (!row || !id || !isSameProject(row.projectId, data.projectId)) {
            continue;
          }

          const key: string = `${relation.type}:${id}`;

          if (seen.has(key)) {
            continue;
          }

          seen.add(key);

          resources.push({
            type: relation.type,
            id: id,
            name: row.name?.toString() || "",
          });
        }
      }
    }

    return resources;
  }

  /*
   * The names, for plain-text surfaces (emails, SMS-style summaries).
   *
   * `seriesSummary` is an alert's series identity - the pod or container a
   * grouped monitor raised it for (SeriesLabelDisplay.buildInlineSummary).
   * It names what broke more precisely than the monitor does, so it takes
   * the monitor's place at the head of the list rather than joining it.
   *
   * A name that repeats (a monitor and a host both called "web-01") is
   * printed once: this is a sentence, not a table.
   */
  public static getNames(data: {
    resources: Array<LinkedAffectedResource>;
    seriesSummary?: string | undefined;
  }): Array<string> {
    const names: Array<string> = [];
    const seenNames: Set<string> = new Set<string>();
    const seriesSummary: string = data.seriesSummary?.trim() || "";

    const addName: (name: string) => void = (name: string): void => {
      const trimmed: string = name.trim();

      if (!trimmed || seenNames.has(trimmed)) {
        return;
      }

      seenNames.add(trimmed);
      names.push(trimmed);
    };

    addName(seriesSummary);

    for (const resource of data.resources) {
      if (seriesSummary && resource.type === LinkedAffectedResourceType.Monitor) {
        continue;
      }

      addName(resource.name);
    }

    return names;
  }

  // getNames joined with ", ", or `fallback` when there are none.
  public static getText(data: {
    resources: Array<LinkedAffectedResource>;
    seriesSummary?: string | undefined;
    fallback: string;
  }): string {
    return (
      LinkedAffectedResources.getNames({
        resources: data.resources,
        seriesSummary: data.seriesSummary,
      }).join(", ") || data.fallback
    );
  }

  public static getDashboardUrl(data: {
    dashboardUrl: URL;
    projectId: ObjectID;
    resource: LinkedAffectedResource;
  }): URL {
    const relation: LinkedAffectedResourceRelation =
      LinkedAffectedResources.getRelationForType(data.resource.type);

    // URL.addRoute mutates, and the caller reuses its dashboard URL.
    return URL.fromString(data.dashboardUrl.toString()).addRoute(
      `/${data.projectId.toString()}/${relation.dashboardRoute}/${data.resource.id}`,
    );
  }

  /*
   * The bullets under a feed item's "🌎 Resources Affected" header.
   *
   * A monitor keeps the bullet the created feeds have always printed,
   * `- [<name>](<monitor link>)`. An SLO is `- [SLO <name>](<link>)` from
   * getSloAffectedResourceMarkdownLines, as before. Every other resource
   * follows the SLO's shape, `- [Host <name>](<link>)`, so the reader can
   * tell a host from a cluster from a service.
   *
   * Those names are escaped: feeds render without safe mode and the same
   * markdown goes to Slack and Teams, and a host or cluster name can come
   * from an agent rather than from someone typing it.
   *
   * The dashboard URL is looked up only when something other than a
   * monitor is listed; a monitor link comes from MonitorService.
   */
  public static async getMarkdownLines(data: {
    projectId: ObjectID;
    resources: Array<LinkedAffectedResource>;
  }): Promise<Array<string>> {
    const lines: Array<string> = [];
    const slos: Array<SloAffectedResourceLinkSubject> = [];
    let dashboardUrl: URL | null = null;

    for (const resource of data.resources) {
      if (resource.type === LinkedAffectedResourceType.Monitor) {
        const monitorLink: URL = await MonitorService.getMonitorLinkInDashboard(
          data.projectId,
          new ObjectID(resource.id),
        );

        lines.push(`- [${resource.name}](${monitorLink.toString()})`);
        continue;
      }

      if (resource.type === LinkedAffectedResourceType.ServiceLevelObjective) {
        slos.push({
          _id: resource.id,
          name: resource.name,
          // Already held to this project by collect.
          projectId: data.projectId,
        });
        continue;
      }

      if (!dashboardUrl) {
        dashboardUrl = await DatabaseConfig.getDashboardUrl();
      }

      const label: string = LinkedAffectedResources.getRelationForType(
        resource.type,
      ).label;
      const escapedName: string = escapeMarkdownInline(resource.name).trim();
      const linkText: string = escapedName ? `${label} ${escapedName}` : label;

      lines.push(
        `- [${linkText}](${LinkedAffectedResources.getDashboardUrl({
          dashboardUrl: dashboardUrl,
          projectId: data.projectId,
          resource: resource,
        }).toString()})`,
      );
    }

    if (slos.length > 0) {
      lines.push(
        ...getSloAffectedResourceMarkdownLines({
          dashboardUrl: dashboardUrl || (await DatabaseConfig.getDashboardUrl()),
          projectId: data.projectId,
          serviceLevelObjectives: slos,
        }),
      );
    }

    return lines;
  }

  private static getRelationForType(
    type: LinkedAffectedResourceType,
  ): LinkedAffectedResourceRelation {
    // Every type has at least one entry, so this always finds one.
    return LINKED_AFFECTED_RESOURCE_RELATIONS.find(
      (relation: LinkedAffectedResourceRelation) => {
        return relation.type === type;
      },
    )!;
  }
}
