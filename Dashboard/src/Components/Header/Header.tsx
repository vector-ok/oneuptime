import React, {
    FunctionComponent,
    ReactElement,
    useEffect,
    useState,
} from 'react';
// import SearchBox from './SearchBox';
// import Notifications from './Notifications';
import Help from './Help';
import UserProfile from './UserProfile';
import ProjectPicker from './ProjectPicker';
import Header from 'CommonUI/src/Components/Header/Header';
import Project from 'Model/Models/Project';
import ProjectInvitationsModal from './ProjectInvitationsModal';
import ActiveIncidentsModal from './ActiveIncidentsModal';
import Logo from './Logo';
import { BILLING_ENABLED } from 'CommonUI/src/Config';
import ModelAPI from 'CommonUI/src/Utils/ModelAPI/ModelAPI';
import BillingPaymentMethod from 'Model/Models/BillingPaymentMethod';
import useAsyncEffect from 'use-async-effect';
import UserProfileModal from './UserProfileModal';
import GlobalEvents from 'CommonUI/src/Utils/GlobalEvents';
import EventName from '../../Utils/EventName';
import SearchBox from './SearchBox';

export interface ComponentProps {
    projects: Array<Project>;
    onProjectSelected: (project: Project) => void;
    onProjectRequestAccepted: () => void;
    onProjectRequestRejected: () => void;
    showProjectModal: boolean;
    onProjectModalClose: () => void;
    selectedProject: Project | null;
}

const DashboardHeader: FunctionComponent<ComponentProps> = (
    props: ComponentProps
): ReactElement => {
    const [showProjectInvitationModal, setShowProjectInvitationModal] =
        useState<boolean>(false);

    const [showActiveIncidentsModal, setShowActiveIncidentsModal] =
        useState<boolean>(false);

    const [projectCountRefreshToggle, setProjectCountRefreshToggle] =
        useState<boolean>(true);

    const [activeIncidentToggleRefresh, setActiveIncidentToggleRefresh] =
        useState<boolean>(true);

    const [isPaymentMethodCountLoading, setPaymentMethodCountLoading] =
        useState<boolean>(false);
    const [paymentMethodCount, setPaymentMethodCount] = useState<number | null>(
        null
    );

    const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

    useAsyncEffect(async () => {
        if (
            props.selectedProject &&
            props.selectedProject._id &&
            BILLING_ENABLED
        ) {
            setPaymentMethodCountLoading(true);
            const paymentMethodsCount: number = await ModelAPI.count(
                BillingPaymentMethod,
                { projectId: props.selectedProject?._id }
            );
            setPaymentMethodCount(paymentMethodsCount);
            setPaymentMethodCountLoading(false);
        }
    }, [props.selectedProject]);

    const refreshIncidentCount: Function = () => {
        setActiveIncidentToggleRefresh(!activeIncidentToggleRefresh);
    };

    useEffect(() => {
        GlobalEvents.addEventListener(
            EventName.ACTIVE_INCIDENTS_COUNT_REFRESH,
            refreshIncidentCount
        );

        return () => {
            // on unmount.
            GlobalEvents.removeEventListener(
                EventName.ACTIVE_INCIDENTS_COUNT_REFRESH,
                refreshIncidentCount
            );
        };
    }, []);

    return (
        <>
            <Header
                leftComponents={
                    <>
                        {props.projects.length === 0 && (
                            <Logo onClick={() => {}} />
                        )}

                        <ProjectPicker
                            showProjectModal={props.showProjectModal}
                            onProjectModalClose={props.onProjectModalClose}
                            projects={props.projects}
                            onProjectSelected={props.onProjectSelected}
                        />

                        {/* <div
                            className="flex"
                            style={{
                                marginLeft: '15px',
                                marginTop: '15px',
                            }}
                        >
                            <CounterModelAlert<TeamMember>
                                alertType={AlertType.INFO}
                                modelType={TeamMember}
                                query={{
                                    userId: User.getUserId(),
                                    hasAcceptedInvitation: false,
                                }}
                                singularName="Project Invitation"
                                pluralName="Project Invitations"
                                requestOptions={{
                                    isMultiTenantRequest: true,
                                }}
                                refreshToggle={projectCountRefreshToggle}
                                onClick={() => {
                                    setShowProjectInvitationModal(true);
                                }}
                                style={{
                                    marginRight: '10px',
                                }}
                            />

                            <CounterModelAlert<Incident>
                                alertType={AlertType.DANGER}
                                modelType={Incident}
                                query={{
                                    currentIncidentState: {
                                        order: 1,
                                    },
                                }}
                                refreshToggle={activeIncidentToggleRefresh}
                                singularName="Active Incident"
                                pluralName="Active Incidents"
                                requestOptions={{
                                    isMultiTenantRequest: true,
                                }}
                                onClick={() => {
                                    setShowActiveIncidentsModal(true);
                                }}
                                style={{
                                    marginRight: '10px',
                                }}
                            />

                            {props.selectedProject?.trialEndsAt &&
                                BILLING_ENABLED &&
                                OneUptimeDate.getNumberOfDaysBetweenDatesInclusive(
                                    OneUptimeDate.getCurrentDate(),
                                    props.selectedProject?.trialEndsAt!
                                ) > 0 && (
                                    <Alert
                                        type={AlertType.INFO}
                                        title={`Trial ends in ${OneUptimeDate.getNumberOfDaysBetweenDatesInclusive(
                                            OneUptimeDate.getCurrentDate(),
                                            props.selectedProject?.trialEndsAt!
                                        )} ${OneUptimeDate.getNumberOfDaysBetweenDatesInclusive(
                                            OneUptimeDate.getCurrentDate(),
                                            props.selectedProject
                                                ?.trialEndsAt!
                                        ) > 1
                                                ? 'days'
                                                : 'day'
                                            }`}
                                        style={{
                                            marginRight: '10px',
                                        }}
                                    />
                                )}
                        </div> */}
                    </>
                }
                centerComponents={
                    <>
                        <SearchBox
                            key={2}
                            selectedProject={props.selectedProject}
                            onChange={(_value: string) => {}}
                        />{' '}
                    </>
                }
                rightComponents={
                    <>
                        {/* <Notifications /> */}
                        {/* {BILLING_ENABLED &&
                            props.selectedProject?.id &&
                            props.selectedProject.paymentProviderPlanId &&
                            !SubscriptionPlan.isFreePlan(
                                props.selectedProject.paymentProviderPlanId,
                                getAllEnvVars()
                            ) &&
                            !SubscriptionPlan.isCustomPricingPlan(
                                props.selectedProject.paymentProviderPlanId,
                                getAllEnvVars()
                            ) &&
                            !isPaymentMethodCountLoading &&
                            paymentMethodCount === 0 ? (
                            <Button
                                title="Add Card Details"
                                onClick={() => {
                                    Navigation.navigate(
                                        RouteUtil.populateRouteParams(
                                            RouteMap[
                                            PageMap.SETTINGS_BILLING
                                            ] as Route
                                        )
                                    );
                                }}
                                buttonStyle={ButtonStyleType.LINK}
                                icon={IconProp.Billing}
                                textStyle={{
                                    fontWeight: 500,
                                }}
                            ></Button>
                        ) : (
                            <></>
                        )}
                        {BILLING_ENABLED &&
                            props.selectedProject?.id &&
                            props.selectedProject.paymentProviderPlanId &&
                            SubscriptionPlan.isFreePlan(
                                props.selectedProject.paymentProviderPlanId,
                                getAllEnvVars()
                            ) ? (
                            <Upgrade />

                        ) : (
                            <></>
                        )} */}
                        <Help />
                        <UserProfile
                            onClickUserProfle={() => {
                                setShowProfileModal(true);
                            }}
                        />
                    </>
                }
            />

            {showProjectInvitationModal && (
                <ProjectInvitationsModal
                    onClose={() => {
                        setShowProjectInvitationModal(false);
                    }}
                    onRequestAccepted={() => {
                        props.onProjectRequestAccepted();
                        setProjectCountRefreshToggle(
                            !projectCountRefreshToggle
                        );
                    }}
                    onRequestRejected={() => {
                        props.onProjectRequestRejected();
                        setProjectCountRefreshToggle(
                            !projectCountRefreshToggle
                        );
                    }}
                />
            )}

            {showProfileModal && (
                <UserProfileModal
                    onClose={() => {
                        setShowProfileModal(false);
                    }}
                />
            )}

            {showActiveIncidentsModal && (
                <ActiveIncidentsModal
                    onClose={() => {
                        setShowActiveIncidentsModal(false);
                    }}
                />
            )}
        </>
    );
};

export default DashboardHeader;
