import PageComponentProps from "../../PageComponentProps";
import SortOrder from "Common/Types/BaseDatabase/SortOrder";
import BadDataException from "Common/Types/Exception/BadDataException";
import ObjectID from "Common/Types/ObjectID";
import FormFieldSchemaType from "Common/UI/Components/Forms/Types/FormFieldSchemaType";
import CardModelDetail from "Common/UI/Components/ModelDetail/CardModelDetail";
import ModelTable from "Common/UI/Components/ModelTable/ModelTable";
import FieldType from "Common/UI/Components/Types/FieldType";
import Navigation from "Common/UI/Utils/Navigation";
import StatusPage from "Common/Models/DatabaseModels/StatusPage";
import StatusPageFooterLink from "Common/Models/DatabaseModels/StatusPageFooterLink";
import React, { Fragment, FunctionComponent, ReactElement } from "react";
import ProjectUtil from "Common/UI/Utils/Project";

const StatusPageDelete: FunctionComponent<PageComponentProps> = (
  props: PageComponentProps,
): ReactElement => {
  const modelId: ObjectID = Navigation.getLastParamAsObjectID(1);

  return (
    <Fragment>
      <CardModelDetail<StatusPage>
        name="Status Page > Branding > Copyright"
        cardProps={{
          title: "Copyright Info",
          description: "Copyright info for your status page",
        }}
        isEditable={true}
        editButtonText={"Edit Copyright"}
        formFields={[
          {
            field: {
              copyrightText: true,
            },
            title: "Copyright Info",
            fieldType: FormFieldSchemaType.Text,
            required: false,
            placeholder: "Acme, Inc.",
          },
        ]}
        modelDetailProps={{
          showDetailsInNumberOfColumns: 1,
          modelType: StatusPage,
          id: "model-detail-status-page",
          fields: [
            {
              field: {
                copyrightText: true,
              },
              fieldType: FieldType.Text,
              title: "Copyright Info",
              placeholder: "No copyright info entered so far.",
            },
          ],
          modelId: modelId,
        }}
      />

      <ModelTable<StatusPageFooterLink>
        modelType={StatusPageFooterLink}
        id="status-page-Footer-link"
        isDeleteable={true}
        name="Status Page > Footer Links"
        userPreferencesKey="status-page-footer-link-table"
        sortBy="order"
        sortOrder={SortOrder.Ascending}
        isCreateable={true}
        isViewable={false}
        isEditable={true}
        query={{
          statusPageId: modelId,
          projectId: ProjectUtil.getCurrentProjectId()!,
        }}
        enableDragAndDrop={true}
        dragDropIndexField="order"
        onBeforeCreate={(
          item: StatusPageFooterLink,
        ): Promise<StatusPageFooterLink> => {
          if (!props.currentProject || !props.currentProject._id) {
            throw new BadDataException("Project ID cannot be null");
          }
          item.statusPageId = modelId;
          item.projectId = new ObjectID(props.currentProject._id);
          return Promise.resolve(item);
        }}
        cardProps={{
          title: "Footer Links",
          description: "Footer Links for your status page",
        }}
        noItemsMessage={"No status footer link for this status page."}
        formFields={[
          {
            field: {
              title: true,
            },
            title: "Title",
            fieldType: FormFieldSchemaType.Text,
            required: true,
            placeholder: "Title",
          },
          {
            field: {
              link: true,
            },
            title: "Link",
            fieldType: FormFieldSchemaType.URL,
            required: true,
            placeholder: "https://link.com",
            disableSpellCheck: true,
          },
        ]}
        showRefreshButton={true}
        viewPageRoute={Navigation.getCurrentRoute()}
        filters={[
          {
            field: {
              title: true,
            },
            title: "Title",
            type: FieldType.Text,
          },
          {
            field: {
              link: true,
            },
            title: "Link",
            type: FieldType.URL,
          },
        ]}
        columns={[
          {
            field: {
              title: true,
            },
            title: "Title",
            type: FieldType.Text,
          },
          {
            field: {
              link: true,
            },
            title: "Link",
            type: FieldType.URL,
            hideOnMobile: true,
          },
        ]}
      />
    </Fragment>
  );
};

export default StatusPageDelete;
