import DisabledWarning from "../../../Components/Monitor/DisabledWarning";
import PageComponentProps from "../../PageComponentProps";
import { PromiseVoidFunction } from "Common/Types/FunctionTypes";
import IconProp from "Common/Types/Icon/IconProp";
import MonitorType from "Common/Types/Monitor/MonitorType";
import ObjectID from "Common/Types/ObjectID";
import { ButtonStyleType } from "Common/UI/Components/Button/Button";
import ComponentLoader from "Common/UI/Components/ComponentLoader/ComponentLoader";
import EmptyState from "Common/UI/Components/EmptyState/EmptyState";
import ErrorMessage from "Common/UI/Components/ErrorMessage/ErrorMessage";
import Modal, { ModalWidth } from "Common/UI/Components/Modal/Modal";
import SimpleLogViewer from "Common/UI/Components/SimpleLogViewer/SimpleLogViewer";
import FieldType from "Common/UI/Components/Types/FieldType";
import { GetReactElementFunction } from "Common/UI/Types/FunctionTypes";
import API from "Common/UI/Utils/API/API";
import ModelAPI from "Common/UI/Utils/ModelAPI/ModelAPI";
import Navigation from "Common/UI/Utils/Navigation";
import Monitor from "Common/Models/DatabaseModels/Monitor";
import MonitorLog from "Common/Models/AnalyticsModels/MonitorLog";
import ProjectUtil from "Common/UI/Utils/Project";
import React, {
  Fragment,
  FunctionComponent,
  ReactElement,
  useState,
} from "react";
import useAsyncEffect from "use-async-effect";
import AnalyticsModelTable from "Common/UI/Components/ModelTable/AnalyticsModelTable";

const MonitorLogs: FunctionComponent<PageComponentProps> = (): ReactElement => {
  const modelId: ObjectID = Navigation.getLastParamAsObjectID(1);
  const [showViewLogsModal, setShowViewLogsModal] = useState<boolean>(false);
  const [logs, setLogs] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>("");

  const fetchItem: PromiseVoidFunction = async (): Promise<void> => {
    // get item.
    setIsLoading(true);

    setError("");
    try {
      const item: Monitor | null = await ModelAPI.getItem({
        modelType: Monitor,
        id: modelId,
        select: {
          monitorType: true,
        },
      });

      if (!item) {
        setError(`Monitor not found`);

        return;
      }

      setMonitorType(item.monitorType);
    } catch (err) {
      setError(API.getFriendlyMessage(err));
    }
    setIsLoading(false);
  };

  const [monitorType, setMonitorType] = useState<MonitorType | undefined>(
    undefined,
  );

  useAsyncEffect(async () => {
    // fetch the model
    await fetchItem();
  }, []);

  const getPageContent: GetReactElementFunction = (): ReactElement => {
    if (!monitorType || isLoading) {
      return <ComponentLoader />;
    }

    if (error) {
      return <ErrorMessage message={error} />;
    }

    if (monitorType === MonitorType.Manual) {
      return (
        <EmptyState
          id="monitoring-probes-empty-state"
          icon={IconProp.Logs}
          title={"No Logs Manual Monitors"}
          description={
            <>
              This is a manual monitor. It does not monitor anything and so, it
              cannot have any logs. You can have logs on other monitor types.{" "}
            </>
          }
        />
      );
    }

    return (
      <AnalyticsModelTable<MonitorLog>
        modelType={MonitorLog}
        query={{
          projectId: ProjectUtil.getCurrentProjectId()!,
          monitorId: modelId.toString(),
        }}
        id="probes-table"
        name="Monitor > Monitor Probes"
        isDeleteable={false}
        isEditable={false}
        isCreateable={false}
        selectMoreFields={{
          logBody: true,
        }}
        cardProps={{
          title: "Monitor Logs",
          description: "Here are the latest logs for this resource.",
        }}
        noItemsMessage={
          "No logs found for this resource. Please check back later."
        }
        actionButtons={[
          {
            title: "View Logs",
            buttonStyleType: ButtonStyleType.NORMAL,
            icon: IconProp.List,
            onClick: async (
              item: MonitorLog,
              onCompleteAction: VoidFunction,
            ) => {
              setLogs(
                item.logBody
                  ? JSON.stringify(item.logBody, null, 2)
                  : "Not logs so far",
              );
              setShowViewLogsModal(true);

              onCompleteAction();
            },
          },
        ]}
        showRefreshButton={true}
        filters={[
          {
            field: {
              time: true,
            },
            type: FieldType.DateTime,
            title: "Time",
          },
        ]}
        columns={[
          {
            field: {
              time: true,
            },

            title: "Time",
            type: FieldType.DateTime,
          },
        ]}
      />
    );
  };

  return (
    <Fragment>
      <DisabledWarning monitorId={modelId} />
      {getPageContent()}
      {showViewLogsModal && (
        <Modal
          title={"Monitor Log"}
          description={"Here are the logs for this monitor."}
          isLoading={false}
          modalWidth={ModalWidth.Large}
          onSubmit={() => {
            setShowViewLogsModal(false);
          }}
          submitButtonText={"Close"}
          submitButtonStyleType={ButtonStyleType.NORMAL}
        >
          <SimpleLogViewer>
            {logs.split("\n").map((log: string, i: number) => {
              return <div key={i}>{log}</div>;
            })}
          </SimpleLogViewer>
        </Modal>
      )}
    </Fragment>
  );
};

export default MonitorLogs;
