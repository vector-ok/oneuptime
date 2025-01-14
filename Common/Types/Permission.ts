// Have "Project" string in the permission to make sure this permission is by Project.
import BadDataException from './Exception/BadDataException';
import { JSONObject } from './JSON';
import ObjectID from './ObjectID';

export interface PermissionProps {
    permission: Permission;
    description: string;
    isAssignableToProject: boolean;
    title: string;
}

enum Permission {
    // Owner of a Project
    ProjectOwner = 'ProjectOwner',

    // Project Admin
    ProjectAdmin = 'ProjectAdmin',

    ProjectMember = 'ProjectMember', // member of a project

    User = 'User', //registered user. Can or cannot belong to a project.

    LoggedInUser = 'LoggedInUser', // Current logged in user.

    CustomerSupport = 'CustomerSupport', // Customer Support for OneUptime.

    Public = 'Public', // non-registered user. Everyone has this permission.

    // Billing Permissions (Owner Permission)
    CanDeleteProject = 'CanDeleteProject',
    CanUpdateProject = 'CanDeleteProject',

    // Billing Permissions (Owner Permission)
    CanCreateProjectApiKey = 'CanCreateProjectApiKey',
    CanDeleteProjectApiKey = 'CanDeleteProjectApiKey',
    CanReadProjectApiKey = 'CanReadProjectApiKey',
    CanEditProjectApiKey = 'CanEditProjectApiKey',
    CanEditProjectApiKeyPermissions = 'CanEditProjectApiKeyPermissions',

    // Billing Permissions (Owner Permission)
    CanManageProjectBilling = 'CanManageProjectBilling',

    // Billing Permissions (Owner Permission)
    CanCreateProjectTeam = 'CanCreateProjectTeam',
    CanDeleteProjectTeam = 'CanDeleteProjectTeam',
    CanReadProjectTeam = 'CanReadProjectTeam',
    CanEditProjectTeam = 'CanEditProjectTeam',
    CanInviteProjectTeamMembers = 'CanInviteProjectTeamMembers',
    CanEditProjectTeamPermissions = 'CanEditProjectTeamPermissions',

    // Probe Permissions (Owner Permission)
    CanCreateProjectProbe = 'CanCreateProjectProbe',
    CanDeleteProjectProbe = 'CanDeleteProjectProbe',
    CanEditProjectProbe = 'CanEditProjectProbe',
    CanReadProjectProbe = 'CanReadProjectProbe',

    // Probe Permissions (Owner Permission)
    CanCreateProjectIncident = 'CanCreateProjectIncident',
    CanDeleteProjectIncident = 'CanDeleteProjectIncident',
    CanEditProjectIncident = 'CanEditProjectIncident',
    CanReadProjectIncident = 'CanReadProjectIncident',

    // Probe Permissions (Owner Permission)
    CanCreateProjectDomain = 'CanCreateProjectDomain',
    CanDeleteProjectDomain = 'CanDeleteProjectDomain',
    CanEditProjectDomain = 'CanEditProjectDomain',
    CanReadProjectDomain = 'CanReadProjectDomain',

    // Probe Permissions (Owner Permission)
    CanCreateStatusPageResource = 'CanCreateStatusPageResource',
    CanDeleteStatusPageResource = 'CanDeleteStatusPageResource',
    CanEditStatusPageResource = 'CanEditStatusPageResource',
    CanReadStatusPageResource = 'CanReadStatusPageResource',

    // Probe Permissions (Owner Permission)
    CanCreateStatusPageGroup = 'CanCreateStatusPageGroup',
    CanDeleteStatusPageGroup = 'CanDeleteStatusPageGroup',
    CanEditStatusPageGroup = 'CanEditStatusPageGroup',
    CanReadStatusPageGroup = 'CanReadStatusPageGroup',

    // Probe Permissions (Owner Permission)
    CanCreateStatusPageDomain = 'CanCreateStatusPageDomain',
    CanDeleteStatusPageDomain = 'CanDeleteStatusPageDomain',
    CanEditStatusPageDomain = 'CanEditStatusPageDomain',
    CanReadStatusPageDomain = 'CanReadStatusPageDomain',

    // Label Permissions (Owner + Admin Permission by default)
    CanCreateProjectLabel = 'CanCreateProjectLabel',
    CanEditProjectLabel = 'CanEditProjectLabel',
    CanReadProjectLabel = 'CanReadProjectLabel',
    CanDeleteProjectLabel = 'CanDeleteProjectLabel',
    CanAddLabelsToProjectResources = 'CanAddLabelsToProjectResources',

    // Incident Status Permissions (Owner + Admin Permission by default)
    CanCreateIncidentState = 'CanCreateIncidentState',
    CanEditIncidentState = 'CanEditIncidentState',
    CanReadIncidentState = 'CanReadIncidentState',
    CanDeleteIncidentState = 'CanDeleteIncidentState',

    // MonitorStatus Permissions (Owner + Admin Permission by default)
    CanCreateProjectMonitorStatus = 'CanCreateProjectMonitorStatus',
    CanEditProjectMonitorStatus = 'CanEditProjectMonitorStatus',
    CanReadProjectMonitorStatus = 'CanReadProjectMonitorStatus',
    CanDeleteProjectMonitorStatus = 'CanDeleteProjectMonitorStatus',

    // IncidentState Permissions (Owner + Admin Permission by default)
    CanCreateProjectIncidentState = 'CanCreateProjectIncidentState',
    CanEditProjectIncidentState = 'CanEditProjectIncidentState',
    CanReadProjectIncidentState = 'CanReadProjectIncidentState',
    CanDeleteProjectIncidentState = 'CanDeleteProjectIncidentState',

    // Resource Permissions (Team Permission)
    CanCreateIncidentInternalNote = 'CanCreateIncidentInternalNote',
    CanEditIncidentInternalNote = 'CanEditIncidentInternalNote',
    CanDeleteIncidentInternalNote = 'CanDeleteIncidentInternalNote',
    CanReadIncidentInternalNote = 'CanReadIncidentInternalNote',

    CanCreateIncidentPublicNote = 'CanCreateIncidentPublicNote',
    CanEditIncidentPublicNote = 'CanEditIncidentPublicNote',
    CanDeleteIncidentPublicNote = 'CanDeleteIncidentPublicNote',
    CanReadIncidentPublicNote = 'CanReadIncidentPublicNote',

    CanCreateProjectMonitor = 'CanCreateProjectMonitor',
    CanEditProjectMonitor = 'CanEditProjectMonitor',
    CanDeleteProjectMonitor = 'CanDeleteProjectMonitor',
    CanReadProjectMonitor = 'CanReadProjectMonitor',

    // Resource Permissions (Team Permission)
    CanCreateProjectStatusPage = 'CanCreateProjectStatusPage',
    CanEditProjectStatusPage = 'CanEditProjectStatusPage',
    CanDeleteProjectStatusPage = 'CanDeleteProjectStatusPage',
    CanReadProjectStatusPage = 'CanReadProjectStatusPage',

    // Resource Permissions (Team Permission)
    CanCreateProjectOnCallDuty = 'CanCreateProjectOnCallDuty',
    CanEditProjectOnCallDuty = 'CanEditProjectOnCallDuty',
    CanDeleteProjectOnCallDuty = 'CanDeleteProjectOnCallDuty',
    CanReadProjectOnCallDuty = 'CanReadProjectOnCallDuty',

    // Project SMTP Config (Team Permission)
    CanCreateProjectSMTPConfig = 'CanCreateProjectSMTPConfig',
    CanEditProjectSMTPConfig = 'CanEditProjectSMTPConfig',
    CanDeleteProjectSMTPConfig = 'CanDeleteProjectSMTPConfig',
    CanReadProjectSMTPConfig = 'CanReadProjectSMTPConfig',

    // Project SMTP Config (Team Permission)
    CanCreateIncidentSeverity = 'CanCreateIncidentSeverity',
    CanEditIncidentSeverity = 'CanEditIncidentSeverity',
    CanDeleteIncidentSeverity = 'CanDeleteIncidentSeverity',
    CanReadIncidentSeverity = 'CanReadIncidentSeverity',
}

export class PermissionHelper {
    public static doesPermissionsIntersect(
        permissions1: Array<Permission>,
        permissions2: Array<Permission>
    ): boolean {
        return (
            permissions1.filter((value: Permission) => {
                return permissions2.includes(value);
            }).length > 0
        );
    }

    public static getIntersectingPermissions(
        permissions1: Array<Permission>,
        permissions2: Array<Permission>
    ): Array<Permission> {
        return permissions1.filter((value: Permission) => {
            return permissions2.includes(value);
        });
    }

    public static getProjectPermissionProps(): Array<PermissionProps> {
        return this.getAllPermissionProps().filter((item: PermissionProps) => {
            return item.isAssignableToProject;
        });
    }

    public static getDescription(permission: Permission): string {
        const permissionProps: Array<PermissionProps> =
            this.getAllPermissionProps().filter((item: PermissionProps) => {
                return item.permission === permission;
            });

        if (!permissionProps[0]) {
            throw new BadDataException(
                `${permission} does not have permission props`
            );
        }

        return permissionProps[0].description;
    }

    public static getTitle(permission: Permission): string {
        const permissionProps: Array<PermissionProps> =
            this.getAllPermissionProps().filter((item: PermissionProps) => {
                return item.permission === permission;
            });

        if (!permissionProps[0]) {
            throw new BadDataException(
                `${permission} does not have permission props`
            );
        }

        return permissionProps[0].title;
    }

    public static getPermissionTitles(
        permissions: Array<Permission>
    ): Array<string> {
        const props: Array<PermissionProps> = this.getAllPermissionProps();
        const titles: Array<string> = [];

        for (const permission of permissions) {
            const permissionProp: PermissionProps | undefined = props.find(
                (item: PermissionProps) => {
                    return item.permission === permission;
                }
            );

            if (permissionProp) {
                titles.push(permissionProp.title);
            }
        }

        return titles;
    }

    public static getAllPermissionProps(): Array<PermissionProps> {
        const permissions: Array<PermissionProps> = [
            {
                permission: Permission.ProjectOwner,
                title: 'Project Owner',
                description:
                    'Owner of this project, manages billing, inviting other admins to this project, and can delete this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.ProjectMember,
                title: 'Project Member',
                description:
                    'Member of this project. Can view most resources unless restricted.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.ProjectAdmin,
                title: 'Project Admin',
                description:
                    'Owner of this project, manages billing, inviting other admins to this project, and can delete this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.LoggedInUser,
                title: 'Logged in User',
                description:
                    'This permission is assigned to any registered user.',
                isAssignableToProject: false,
            },
            {
                permission: Permission.CustomerSupport,
                title: 'Customer Support',
                description: 'Customer Support Resource of OneUptime.',
                isAssignableToProject: false,
            },
            {
                permission: Permission.User,
                title: 'User',
                description:
                    'Owner of this project, manages billing, inviting other admins to this project, and can delete this project.',
                isAssignableToProject: false,
            },
            {
                permission: Permission.Public,
                title: 'Public',
                description:
                    'Non registered user. Typically used for sign up or log in.',
                isAssignableToProject: false,
            },
            {
                permission: Permission.CanDeleteProject,
                title: 'Can Delete Project',
                description:
                    'A user assigned this permission can delete this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanUpdateProject,
                title: 'Can Update Project',
                description:
                    'A user assigned this permission can update this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanManageProjectBilling,
                title: 'Can Manage Billing',
                description:
                    'A user assigned this permission can update project billing.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanCreateProjectApiKey,
                title: 'Can Create API Key',
                description:
                    'A user assigned this permission can create api keys of this project',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectApiKey,
                title: 'Can Delete API Key',
                description:
                    'A user assigned this permission  can delete api keys of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectApiKeyPermissions,
                title: 'Can Edit API Key Permissions',
                description:
                    'A user assigned this permission  can edit api key permissions of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectApiKey,
                title: 'Can Edit API Key',
                description:
                    'A user assigned this permission can edit api keys of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectApiKey,
                title: 'Can Read API Key',
                description:
                    'A user assigned this permission  can read api keys of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectLabel,
                title: 'Can Create Label',
                description:
                    'A user assigned this permission can create labels this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectLabel,
                title: 'Can Delete Label',
                description:
                    'A user assigned this permission  can delete labels of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanAddLabelsToProjectResources,
                title: 'Can Add Label to Resources',
                description:
                    'A user assigned this permission can add project labels to resources of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectLabel,
                title: 'Can Edit Label',
                description:
                    'A user assigned this permission can edit labels of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectLabel,
                title: 'Can Read Label',
                description:
                    'A user assigned this permission  can read labels of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateIncidentState,
                title: 'Can Create Incident State',
                description:
                    'A user assigned this permission can create incident states this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteIncidentState,
                title: 'Can Delete Incident State',
                description:
                    'A user assigned this permission  can delete incident states of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditIncidentState,
                title: 'Can Edit Incident State',
                description:
                    'A user assigned this permission can edit incident states of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadIncidentState,
                title: 'Can Read Incident State',
                description:
                    'A user assigned this permission  can read incident states of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectMonitorStatus,
                title: 'Can Create Monitor Status',
                description:
                    'A user assigned this permission can create monitor statuses this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectMonitorStatus,
                title: 'Can Delete Monitor Status',
                description:
                    'A user assigned this permission  can delete monitor statuses of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectMonitorStatus,
                title: 'Can Edit Monitor Status',
                description:
                    'A user assigned this permission can edit monitor statuses of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectMonitorStatus,
                title: 'Can Read Monitor Status',
                description:
                    'A user assigned this permission  can read monitor statuses of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectIncidentState,
                title: 'Can Create Incident State',
                description:
                    'A user assigned this permission can create incident state in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectIncidentState,
                title: 'Can Delete Incident State',
                description:
                    'A user assigned this permission  can delete incident state in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectIncidentState,
                title: 'Can Edit Incident State',
                description:
                    'A user assigned this permission can edit incident state in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectIncidentState,
                title: 'Can Read Incident State',
                description:
                    'A user assigned this permission  can read incident state in this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectDomain,
                title: 'Can Create Domain',
                description:
                    'A user assigned this permission can create Domain in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectDomain,
                title: 'Can Delete Domain',
                description:
                    'A user assigned this permission  can delete Domain in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectDomain,
                title: 'Can Edit Domain',
                description:
                    'A user assigned this permission can edit Domain in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectDomain,
                title: 'Can Read Domain',
                description:
                    'A user assigned this permission  can read Domain in this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateStatusPageResource,
                title: 'Can Create Status Page Resource',
                description:
                    'A user assigned this permission can create Status Page Resource in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteStatusPageResource,
                title: 'Can Delete Status Page Resource',
                description:
                    'A user assigned this permission  can delete Status Page Resource in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditStatusPageResource,
                title: 'Can Edit Status Page Resource',
                description:
                    'A user assigned this permission can edit Status Page Resource in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadStatusPageResource,
                title: 'Can Read Status Page Resource',
                description:
                    'A user assigned this permission  can read Status Page Resource in this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateStatusPageGroup,
                title: 'Can Create Status Page Group',
                description:
                    'A user assigned this permission can create Status Page Group in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteStatusPageGroup,
                title: 'Can Delete Status Page Group',
                description:
                    'A user assigned this permission  can delete Status Page Group in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditStatusPageGroup,
                title: 'Can Edit Status Page Group',
                description:
                    'A user assigned this permission can edit Status Page Group in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadStatusPageGroup,
                title: 'Can Read Status Page Group',
                description:
                    'A user assigned this permission  can read Status Page Group in this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateStatusPageDomain,
                title: 'Can Create Status Page Domain',
                description:
                    'A user assigned this permission can create Status Page Domain in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteStatusPageDomain,
                title: 'Can Delete Status Page Domain',
                description:
                    'A user assigned this permission  can delete Status Page Domain in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditStatusPageDomain,
                title: 'Can Edit Status Page Domain',
                description:
                    'A user assigned this permission can edit Status Page Domain in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadStatusPageDomain,
                title: 'Can Read Status Page Domain',
                description:
                    'A user assigned this permission  can read Status Page Domain in this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectSMTPConfig,
                title: 'Can Create SMTP Config',
                description:
                    'A user assigned this permission can create SMTP configs this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectSMTPConfig,
                title: 'Can Delete SMTP Config',
                description:
                    'A user assigned this permission  can delete SMTP configs of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectSMTPConfig,
                title: 'Can Edit SMTP Config',
                description:
                    'A user assigned this permission can edit SMTP configs of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectSMTPConfig,
                title: 'Can Read SMTP Config',
                description:
                    'A user assigned this permission  can read SMTP configs of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateStatusPageDomain,
                title: 'Can Create Status Page Domain',
                description:
                    'A user assigned this permission can create Status Page Domain in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteStatusPageDomain,
                title: 'Can Delete Status Page Domain',
                description:
                    'A user assigned this permission  can delete Status Page Domain in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditStatusPageDomain,
                title: 'Can Edit Status Page Domain',
                description:
                    'A user assigned this permission can edit Status Page Domain in this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadStatusPageDomain,
                title: 'Can Read Status Page Domain',
                description:
                    'A user assigned this permission  can read Status Page Domain in this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateIncidentSeverity,
                title: 'Can Create Incident Severity',
                description:
                    'A user assigned this permission can create Incident Severity this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteIncidentSeverity,
                title: 'Can Delete Incident Severity',
                description:
                    'A user assigned this permission  can delete Incident Severity of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditIncidentSeverity,
                title: 'Can Edit Incident Severity',
                description:
                    'A user assigned this permission can edit Incident Severity of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadIncidentSeverity,
                title: 'Can Read Incident Severity',
                description:
                    'A user assigned this permission  can read Incident Severity of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectTeam,
                title: 'Can Create Team',
                description:
                    'A user assigned this permission can create teams this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectTeam,
                title: 'Can Delete Team',
                description:
                    'A user assigned this permission  can delete teams of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanInviteProjectTeamMembers,
                title: 'Can Invite New Members',
                description:
                    'A user assigned this permission can inivte users to the team.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectTeamPermissions,
                title: 'Can Edit Team Permissions',
                description:
                    'A user assigned this permission can edit team permissions of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectTeam,
                title: 'Can Edit Team',
                description:
                    'A user assigned this permission can edit teams of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectTeam,
                title: 'Can Read Teams',
                description:
                    'A user assigned this permission  can read teams of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectMonitor,
                title: 'Can Create Monitor',
                description:
                    'A user assigned this permission can create monitor this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectMonitor,
                title: 'Can Delete Monitor',
                description:
                    'A user assigned this permission  can delete monitor of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectMonitor,
                title: 'Can Edit Monitor',
                description:
                    'A user assigned this permission can edit monitor of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectMonitor,
                title: 'Can Read Monitor',
                description:
                    'A user assigned this permission  can read monitor of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateIncidentInternalNote,
                title: 'Can Create Incident Internal Note',
                description:
                    'A user assigned this permission can create Incident Internal Note this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteIncidentInternalNote,
                title: 'Can Delete Incident Internal Note',
                description:
                    'A user assigned this permission  can delete Incident Internal Note of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditIncidentInternalNote,
                title: 'Can Edit Incident Internal Note',
                description:
                    'A user assigned this permission can edit Incident Internal Note of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadIncidentInternalNote,
                title: 'Can Read Incident Internal Note',
                description:
                    'A user assigned this permission  can read Incident Internal Note of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateIncidentPublicNote,
                title: 'Can Create Incident Status Page Note',
                description:
                    'A user assigned this permission can create Incident Status Page Note this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteIncidentPublicNote,
                title: 'Can Delete Incident Status Page Note',
                description:
                    'A user assigned this permission  can delete Incident Status Page Note of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditIncidentPublicNote,
                title: 'Can Edit Incident Status Page Note',
                description:
                    'A user assigned this permission can edit Incident Status Page Note of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadIncidentPublicNote,
                title: 'Can Read Incident Status Page Note',
                description:
                    'A user assigned this permission  can read Incident Status Page Note of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectOnCallDuty,
                title: 'Can Create On-Call Duty',
                description:
                    'A user assigned this permission can create on-call duty this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectOnCallDuty,
                title: 'Can Delete On-Call Duty',
                description:
                    'A user assigned this permission  can delete on-call duty of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectOnCallDuty,
                title: 'Can Edit On-Call Duty',
                description:
                    'A user assigned this permission can edit on-call duty of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectOnCallDuty,
                title: 'Can Read On-Call Duty',
                description:
                    'A user assigned this permission  can read on-call duty of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectStatusPage,
                title: 'Can Create Status Page',
                description:
                    'A user assigned this permission can create status pages this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectStatusPage,
                title: 'Can Delete Status Page',
                description:
                    'A user assigned this permission  can delete status pages of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectStatusPage,
                title: 'Can Edit Status Page',
                description:
                    'A user assigned this permission can edit status pages of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectStatusPage,
                title: 'Can Read Status Page',
                description:
                    'A user assigned this permission  can read status pages of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectProbe,
                title: 'Can Create Probe',
                description:
                    'A user assigned this permission can create probe this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectProbe,
                title: 'Can Delete Probe',
                description:
                    'A user assigned this permission  can delete probe of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectProbe,
                title: 'Can Edit Probe',
                description:
                    'A user assigned this permission can edit probe of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectProbe,
                title: 'Can Read Probe',
                description:
                    'A user assigned this permission  can read probe of this project.',
                isAssignableToProject: true,
            },

            {
                permission: Permission.CanCreateProjectIncident,
                title: 'Can Create Incident',
                description:
                    'A user assigned this permission can create incident this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanDeleteProjectIncident,
                title: 'Can Delete Incident',
                description:
                    'A user assigned this permission  can delete incident of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanEditProjectIncident,
                title: 'Can Edit Incident',
                description:
                    'A user assigned this permission can edit incident of this project.',
                isAssignableToProject: true,
            },
            {
                permission: Permission.CanReadProjectIncident,
                title: 'Can Read Incident',
                description:
                    'A user assigned this permission  can read incident of this project.',
                isAssignableToProject: true,
            },
        ];

        return permissions;
    }
}

export interface UserGlobalAccessPermission extends JSONObject {
    projectIds: Array<ObjectID>;
    globalPermissions: Array<Permission>;
    _type: 'UserGlobalAccessPermission';
}

export interface UserPermission extends JSONObject {
    _type: 'UserPermission';
    permission: Permission;
    labelIds: Array<ObjectID>;
}

export interface UserProjectAccessPermission extends JSONObject {
    _type: 'UserProjectAccessPermission';
    projectId: ObjectID;
    permissions: Array<UserPermission>;
}

export const PermissionsArray: Array<string> = [
    ...new Set(Object.keys(Permission)),
]; // Returns ["Owner", "Administrator"...]

export function instaceOfUserProjectAccessPermission(
    object: any
): object is UserProjectAccessPermission {
    return object._type === 'UserProjectAccessPermission';
}

export function instaceOfUserPermission(object: any): object is UserPermission {
    return object._type === 'UserPermission';
}

export function instaceOfUserGlobalAccessPermission(
    object: any
): object is UserGlobalAccessPermission {
    return object._type === 'UserGlobalAccessPermission';
}

export default Permission;
