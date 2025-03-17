import CreateBy from "../Types/Database/CreateBy";
import DeleteBy from "../Types/Database/DeleteBy";
import { OnCreate, OnDelete } from "../Types/Database/Hooks";
import QueryHelper from "../Types/Database/QueryHelper";
import DatabaseService from "./DatabaseService";
import IncidentPublicNoteService from "./IncidentPublicNoteService";
import IncidentService from "./IncidentService";
import IncidentStateService from "./IncidentStateService";
import UserService from "./UserService";
import SortOrder from "../../Types/BaseDatabase/SortOrder";
import OneUptimeDate from "../../Types/Date";
import BadDataException from "../../Types/Exception/BadDataException";
import { JSONObject } from "../../Types/JSON";
import ObjectID from "../../Types/ObjectID";
import PositiveNumber from "../../Types/PositiveNumber";
import Incident from "Common/Models/DatabaseModels/Incident";
import IncidentPublicNote from "Common/Models/DatabaseModels/IncidentPublicNote";
import IncidentState from "Common/Models/DatabaseModels/IncidentState";
import IncidentStateTimeline from "Common/Models/DatabaseModels/IncidentStateTimeline";
import { IsBillingEnabled } from "../EnvironmentConfig";
import logger from "../Utils/Logger";
import IncidentFeedService from "./IncidentFeedService";
import { IncidentFeedEventType } from "../../Models/DatabaseModels/IncidentFeed";

export class Service extends DatabaseService<IncidentStateTimeline> {
  public constructor() {
    super(IncidentStateTimeline);
    if (IsBillingEnabled) {
      this.hardDeleteItemsOlderThanInDays("startsAt", 120);
    }
  }

  @CaptureSpan()
  public async getResolvedStateIdForProject(
    projectId: ObjectID,
  ): Promise<ObjectID> {
    const resolvedState: IncidentState | null =
      await IncidentStateService.findOneBy({
        query: {
          projectId: projectId,
          isResolvedState: true,
        },
        props: {
          isRoot: true,
        },
        select: {
          _id: true,
        },
      });

    if (!resolvedState) {
      throw new BadDataException("No resolved state found for the project");
    }

    return resolvedState.id!;
  }

  protected override async onBeforeCreate(
    createBy: CreateBy<IncidentStateTimeline>,
  ): Promise<OnCreate<IncidentStateTimeline>> {
    if (!createBy.data.incidentId) {
      throw new BadDataException("incidentId is null");
    }

    if (!createBy.data.startsAt) {
      createBy.data.startsAt = OneUptimeDate.getCurrentDate();
    }

    if (
      (createBy.data.createdByUserId ||
        createBy.data.createdByUser ||
        createBy.props.userId) &&
      !createBy.data.rootCause
    ) {
      let userId: ObjectID | undefined = createBy.data.createdByUserId;

      if (createBy.props.userId) {
        userId = createBy.props.userId;
      }

      if (createBy.data.createdByUser && createBy.data.createdByUser.id) {
        userId = createBy.data.createdByUser.id;
      }

      if (userId) {
        createBy.data.rootCause = `Incident state created by ${await UserService.getUserMarkdownString(
          {
            userId: userId!,
            projectId: createBy.data.projectId || createBy.props.tenantId!,
          },
        )}`;
      }
    }

    const stateBeforeThis: IncidentStateTimeline | null = await this.findOneBy({
      query: {
        incidentId: createBy.data.incidentId,
        startsAt: QueryHelper.lessThanEqualTo(createBy.data.startsAt),
      },
      sort: {
        startsAt: SortOrder.Descending,
      },
      props: {
        isRoot: true,
      },
      select: {
        incidentStateId: true,
        startsAt: true,
        endsAt: true,
      },
    });

    logger.debug("State Before this");
    logger.debug(stateBeforeThis);

    // If this is the first state, then do not notify the owner.
    if (!stateBeforeThis) {
      // since this is the first status, do not notify the owner.
      createBy.data.isOwnerNotified = true;
    }

    const stateAfterThis: IncidentStateTimeline | null = await this.findOneBy({
      query: {
        incidentId: createBy.data.incidentId,
        startsAt: QueryHelper.greaterThan(createBy.data.startsAt),
      },
      sort: {
        startsAt: SortOrder.Ascending,
      },
      props: {
        isRoot: true,
      },
      select: {
        incidentStateId: true,
        startsAt: true,
        endsAt: true,
      },
    });

    // compute ends at. It's the start of the next status.
    if (stateAfterThis && stateAfterThis.startsAt) {
      createBy.data.endsAt = stateAfterThis.startsAt;
    }

    logger.debug("State After this");
    logger.debug(stateAfterThis);

    const publicNote: string | undefined = (
      createBy.miscDataProps as JSONObject | undefined
    )?.["publicNote"] as string | undefined;

    if (publicNote) {
      // mark status page subscribers as notified for this state change because we dont want to send duplicate (two) emails one for public note and one for state change.
      if (createBy.data.shouldStatusPageSubscribersBeNotified) {
        createBy.data.isStatusPageSubscribersNotified = true;
      }
    }

    return {
      createBy,
      carryForward: {
        statusTimelineBeforeThisStatus: stateBeforeThis || null,
        statusTimelineAfterThisStatus: stateAfterThis || null,
        publicNote: publicNote,
      },
    };
  }

  protected override async onCreateSuccess(
    onCreate: OnCreate<IncidentStateTimeline>,
    createdItem: IncidentStateTimeline,
  ): Promise<IncidentStateTimeline> {
    if (!createdItem.incidentId) {
      throw new BadDataException("incidentId is null");
    }

    if (!createdItem.incidentStateId) {
      throw new BadDataException("incidentStateId is null");
    }
    // update the last status as ended.

    logger.debug("Status Timeline Before this");
    logger.debug(onCreate.carryForward.statusTimelineBeforeThisStatus);

    logger.debug("Status Timeline After this");
    logger.debug(onCreate.carryForward.statusTimelineAfterThisStatus);

    logger.debug("Created Item");
    logger.debug(createdItem);

    // now there are three cases.
    // 1. This is the first status OR there's no status after this.
    if (!onCreate.carryForward.statusTimelineBeforeThisStatus) {
      // This is the first status, no need to update previous status.
      logger.debug("This is the first status.");
    } else if (!onCreate.carryForward.statusTimelineAfterThisStatus) {
      // 2. This is the last status.
      // Update the previous status to end at the start of this status.
      await this.updateOneById({
        id: onCreate.carryForward.statusTimelineBeforeThisStatus.id!,
        data: {
          endsAt: createdItem.startsAt!,
        },
        props: {
          isRoot: true,
        },
      });
      logger.debug("This is the last status.");
    } else {
      // 3. This is in the middle.
      // Update the previous status to end at the start of this status.
      await this.updateOneById({
        id: onCreate.carryForward.statusTimelineBeforeThisStatus.id!,
        data: {
          endsAt: createdItem.startsAt!,
        },
        props: {
          isRoot: true,
        },
      });

      // Update the next status to start at the end of this status.
      await this.updateOneById({
        id: onCreate.carryForward.statusTimelineAfterThisStatus.id!,
        data: {
          startsAt: createdItem.endsAt!,
        },
        props: {
          isRoot: true,
        },
      });
      logger.debug("This status is in the middle.");
    }

    if (!createdItem.endsAt) {
      await IncidentService.updateOneBy({
        query: {
          _id: createdItem.incidentId?.toString(),
        },
        data: {
          currentIncidentStateId: createdItem.incidentStateId,
        },
        props: onCreate.createBy.props,
      });
    }

    const incidentState: IncidentState | null =
      await IncidentStateService.findOneBy({
        query: {
          _id: createdItem.incidentStateId.toString()!,
        },
        props: {
          isRoot: true,
        },
        select: {
          _id: true,
          isResolvedState: true,
          isAcknowledgedState: true,
          isCreatedState: true,
          color: true,
          name: true,
        },
      });

    const stateName: string = incidentState?.name || "";
    let stateEmoji: string = "➡️";

    // if resolved state then change emoji to ✅.

    if (incidentState?.isResolvedState) {
      stateEmoji = "✅";
    } else if (incidentState?.isAcknowledgedState) {
      // eyes emoji for acknowledged state.
      stateEmoji = "👀";
    } else if (incidentState?.isCreatedState) {
      stateEmoji = "🔴";
    }

    const incidentNumber: number | null =
      await IncidentService.getIncidentNumber({
        incidentId: createdItem.incidentId,
      });

    const projectId: ObjectID = createdItem.projectId!;
    const incidentId: ObjectID = createdItem.incidentId!;

    await IncidentFeedService.createIncidentFeedItem({
      incidentId: createdItem.incidentId!,
      projectId: createdItem.projectId!,
      incidentFeedEventType: IncidentFeedEventType.IncidentStateChanged,
      displayColor: incidentState?.color,
      feedInfoInMarkdown:
        stateEmoji +
        ` Changed **[Incident ${incidentNumber}](${(await IncidentService.getIncidentLinkInDashboard(projectId!, incidentId!)).toString()}) State** to **` +
        stateName +
        "**",
      moreInformationInMarkdown: `**Cause:** 
${createdItem.rootCause}`,
      userId: createdItem.createdByUserId || onCreate.createBy.props.userId,
      workspaceNotification: {
        sendWorkspaceNotification: true,
        notifyUserId:
          createdItem.createdByUserId || onCreate.createBy.props.userId,
      },
    });

    const isResolvedState: boolean = incidentState?.isResolvedState || false;

    if (isResolvedState) {
      const incident: Incident | null = await IncidentService.findOneBy({
        query: {
          _id: createdItem.incidentId.toString(),
        },
        select: {
          _id: true,
          projectId: true,
          monitors: {
            _id: true,
          },
        },
        props: {
          isRoot: true,
        },
      });

      if (incident) {
        await IncidentService.markMonitorsActiveForMonitoring(
          incident.projectId!,
          incident.monitors || [],
        );
      }
    }

    if (onCreate.carryForward.publicNote) {
      const publicNote: string = onCreate.carryForward.publicNote;

      const incidentPublicNote: IncidentPublicNote = new IncidentPublicNote();
      incidentPublicNote.incidentId = createdItem.incidentId;
      incidentPublicNote.note = publicNote;
      incidentPublicNote.postedAt = createdItem.startsAt!;
      incidentPublicNote.createdAt = createdItem.startsAt!;
      incidentPublicNote.projectId = createdItem.projectId!;
      incidentPublicNote.shouldStatusPageSubscribersBeNotifiedOnNoteCreated =
        Boolean(createdItem.shouldStatusPageSubscribersBeNotified);

      await IncidentPublicNoteService.create({
        data: incidentPublicNote,
        props: onCreate.createBy.props,
      });
    }

    IncidentService.refreshIncidentMetrics({
      incidentId: createdItem.incidentId,
    }).catch((error: Error) => {
      logger.error(`Error while refreshing incident metrics:`);
      logger.error(error);
    });

    return createdItem;
  }

  protected override async onBeforeDelete(
    deleteBy: DeleteBy<IncidentStateTimeline>,
  ): Promise<OnDelete<IncidentStateTimeline>> {
    if (deleteBy.query._id) {
      const incidentStateTimelineToBeDeleted: IncidentStateTimeline | null =
        await this.findOneById({
          id: new ObjectID(deleteBy.query._id as string),
          select: {
            incidentId: true,
            startsAt: true,
            endsAt: true,
          },
          props: {
            isRoot: true,
          },
        });

      const incidentId: ObjectID | undefined =
        incidentStateTimelineToBeDeleted?.incidentId;

      if (incidentId) {
        const incidentStateTimeline: PositiveNumber = await this.countBy({
          query: {
            incidentId: incidentId,
          },
          props: {
            isRoot: true,
          },
        });

        if (!incidentStateTimelineToBeDeleted) {
          throw new BadDataException("Incident state timeline not found.");
        }

        if (incidentStateTimeline.isOne()) {
          throw new BadDataException(
            "Cannot delete the only state timeline. Incident should have at least one state in its timeline.",
          );
        }

        // There are three cases.
        // 1. This is the first state.
        // 2. This is the last state.
        // 3. This is in the middle.

        const stateBeforeThis: IncidentStateTimeline | null =
          await this.findOneBy({
            query: {
              _id: QueryHelper.notEquals(deleteBy.query._id as string),
              incidentId: incidentId,
              startsAt: QueryHelper.lessThanEqualTo(
                incidentStateTimelineToBeDeleted.startsAt!,
              ),
            },
            sort: {
              startsAt: SortOrder.Descending,
            },
            props: {
              isRoot: true,
            },
            select: {
              incidentStateId: true,
              startsAt: true,
              endsAt: true,
            },
          });

        const stateAfterThis: IncidentStateTimeline | null =
          await this.findOneBy({
            query: {
              incidentId: incidentId,
              startsAt: QueryHelper.greaterThan(
                incidentStateTimelineToBeDeleted.startsAt!,
              ),
            },
            sort: {
              startsAt: SortOrder.Ascending,
            },
            props: {
              isRoot: true,
            },
            select: {
              incidentStateId: true,
              startsAt: true,
              endsAt: true,
            },
          });

        if (!stateBeforeThis) {
          // This is the first state, no need to update previous state.
          logger.debug("This is the first state.");
        } else if (!stateAfterThis) {
          // This is the last state.
          // Update the previous state to end at the end of this state.
          await this.updateOneById({
            id: stateBeforeThis.id!,
            data: {
              endsAt: incidentStateTimelineToBeDeleted.endsAt!,
            },
            props: {
              isRoot: true,
            },
          });
          logger.debug("This is the last state.");
        } else {
          // This state is in the middle.
          // Update the previous state to end at the start of the next state.
          await this.updateOneById({
            id: stateBeforeThis.id!,
            data: {
              endsAt: stateAfterThis.startsAt!,
            },
            props: {
              isRoot: true,
            },
          });

          // Update the next state to start at the start of this state.
          await this.updateOneById({
            id: stateAfterThis.id!,
            data: {
              startsAt: incidentStateTimelineToBeDeleted.startsAt!,
            },
            props: {
              isRoot: true,
            },
          });
          logger.debug("This state is in the middle.");
        }
      }

      return { deleteBy, carryForward: incidentId };
    }

    return { deleteBy, carryForward: null };
  }

  protected override async onDeleteSuccess(
    onDelete: OnDelete<IncidentStateTimeline>,
    _itemIdsBeforeDelete: ObjectID[],
  ): Promise<OnDelete<IncidentStateTimeline>> {
    if (onDelete.carryForward) {
      // this is incidentId.
      const incidentId: ObjectID = onDelete.carryForward as ObjectID;

      // get last status of this incident.
      const incidentStateTimeline: IncidentStateTimeline | null =
        await this.findOneBy({
          query: {
            incidentId: incidentId,
          },
          sort: {
            startsAt: SortOrder.Descending,
          },
          props: {
            isRoot: true,
          },
          select: {
            _id: true,
            incidentStateId: true,
          },
        });

      if (incidentStateTimeline && incidentStateTimeline.incidentStateId) {
        await IncidentService.updateOneBy({
          query: {
            _id: incidentId.toString(),
          },
          data: {
            currentIncidentStateId: incidentStateTimeline.incidentStateId,
          },
          props: {
            isRoot: true,
          },
        });
      }
    }

    return onDelete;
  }
}

export default new Service();
