import Page from "../../Components/Page/Page";
import API from "../../Utils/API";
import { STATUS_PAGE_API_URL } from "../../Utils/Config";
import PageMap from "../../Utils/PageMap";
import RouteMap, { RouteUtil } from "../../Utils/RouteMap";
import StatusPageUtil from "../../Utils/StatusPage";
import SubscribeSideMenu from "./SideMenu";
import { SubscribePageProps } from "./SubscribePageUtils";
import Route from "Common/Types/API/Route";
import Tabs from "Common/UI/Components/Tabs/Tabs";
import URL from "Common/Types/API/URL";
import BadDataException from "Common/Types/Exception/BadDataException";
import { PromiseVoidFunction } from "Common/Types/FunctionTypes";
import ObjectID from "Common/Types/ObjectID";
import Card from "Common/UI/Components/Card/Card";
import { CategoryCheckboxOptionsAndCategories } from "Common/UI/Components/CategoryCheckbox/Index";
import ErrorMessage from "Common/UI/Components/ErrorMessage/ErrorMessage";
import ModelForm, {
  FormType,
  ModelField,
} from "Common/UI/Components/Forms/ModelForm";
import FormFieldSchemaType from "Common/UI/Components/Forms/Types/FormFieldSchemaType";
import FormValues from "Common/UI/Components/Forms/Types/FormValues";
import PageLoader from "Common/UI/Components/Loader/PageLoader";
import LocalStorage from "Common/UI/Utils/LocalStorage";
import SubscriberUtil from "Common/UI/Utils/StatusPage";
import StatusPageSubscriber from "Common/Models/DatabaseModels/StatusPageSubscriber";
import React, {
  FunctionComponent,
  ReactElement,
  useEffect,
  useState,
} from "react";
import { GetReactElementFunction } from "Common/UI/Types/FunctionTypes";

const SubscribePage: FunctionComponent<SubscribePageProps> = (
  props: SubscribePageProps,
): ReactElement => {
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const id: ObjectID = LocalStorage.getItem("statusPageId") as ObjectID;

  const [
    categoryCheckboxOptionsAndCategories,
    setCategoryCheckboxOptionsAndCategories,
  ] = useState<CategoryCheckboxOptionsAndCategories>({
    categories: [],
    options: [],
  });
  const [isLaoding, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchCheckboxOptionsAndCategories: PromiseVoidFunction =
    async (): Promise<void> => {
      try {
        setIsLoading(true);

        const result: CategoryCheckboxOptionsAndCategories =
          await SubscriberUtil.getCategoryCheckboxPropsBasedOnResources(
            id,
            URL.fromString(STATUS_PAGE_API_URL.toString()).addRoute(
              `/resources/${id.toString()}`,
            ),
          );

        setCategoryCheckboxOptionsAndCategories(result);
      } catch (err) {
        setError(API.getFriendlyMessage(err));
      }

      setIsLoading(false);
    };

  useEffect(() => {
    fetchCheckboxOptionsAndCategories().catch((error: Error) => {
      setError(error.message);
    });
  }, []);

  if (!id) {
    throw new BadDataException("Status Page ID is required");
  }

  StatusPageUtil.checkIfUserHasLoggedIn();

  const fields: Array<ModelField<StatusPageSubscriber>> = [
    {
      field: {
        subscriberEmail: true,
      },
      title: "Your Email",
      fieldType: FormFieldSchemaType.Email,
      required: true,
      placeholder: "subscriber@company.com",
      disableSpellCheck: true,
    },
  ];

  if (props.allowSubscribersToChooseResources) {
    fields.push({
      field: {
        isSubscribedToAllResources: true,
      },
      title: "Subscribe to All Resources",
      description:
        "Select this option if you want to subscribe to all resources.",
      fieldType: FormFieldSchemaType.Checkbox,
      required: false,
      defaultValue: true,
    });

    fields.push({
      field: {
        statusPageResources: true,
      },
      title: "Select Resources to Subscribe",
      description: "Please select the resources you want to subscribe to.",
      fieldType: FormFieldSchemaType.CategoryCheckbox,
      required: false,
      categoryCheckboxProps: categoryCheckboxOptionsAndCategories,
      showIf: (model: FormValues<StatusPageSubscriber>) => {
        return !model || !model.isSubscribedToAllResources;
      },
    });
  }

  if (props.allowSubscribersToChooseEventTypes) {
    fields.push({
      field: {
        isSubscribedToAllEventTypes: true,
      },
      title: "Subscribe to All Event Types",
      description:
        "Select this option if you want to subscribe to all event types.",
      fieldType: FormFieldSchemaType.Checkbox,
      required: false,
      defaultValue: true,
    });

    fields.push({
      field: {
        statusPageEventTypes: true,
      },
      title: "Select Event Types to Subscribe",
      description: "Please select the event types you want to subscribe to.",
      fieldType: FormFieldSchemaType.MultiSelectDropdown,
      required: false,
      dropdownOptions: SubscriberUtil.getDropdownPropsBasedOnEventTypes(),
      showIf: (model: FormValues<StatusPageSubscriber>) => {
        return !model || !model.isSubscribedToAllEventTypes;
      },
    });
  }

  const getNewSubscriptionContentElement: GetReactElementFunction =
    (): ReactElement => {
      return (
        <ModelForm<StatusPageSubscriber>
          modelType={StatusPageSubscriber}
          id="email-form"
          name="Status Page > Email Subscribe"
          fields={fields}
          createOrUpdateApiUrl={URL.fromString(
            STATUS_PAGE_API_URL.toString(),
          ).addRoute(`/subscribe/${id.toString()}`)}
          requestHeaders={API.getDefaultHeaders(
            StatusPageUtil.getStatusPageId()!,
          )}
          formType={FormType.Create}
          submitButtonText={"Subscribe"}
          onBeforeCreate={async (item: StatusPageSubscriber) => {
            const id: ObjectID = LocalStorage.getItem(
              "statusPageId",
            ) as ObjectID;
            if (!id) {
              throw new BadDataException("Status Page ID is required");
            }

            item.statusPageId = id;
            return item;
          }}
          onSuccess={() => {
            setIsSuccess(true);
          }}
          maxPrimaryButtonWidth={true}
        />
      );
    };

  const getManageExistingSubscriptionContentElement: GetReactElementFunction =
    (): ReactElement => {
      return (
        <ModelForm<StatusPageSubscriber>
          modelType={StatusPageSubscriber}
          id="email-form"
          name="Status Page > Mage Subscribe"
          fields={[
            {
              field: {
                subscriberEmail: true,
              },
              title: "Please enter your email you have subscribed with",
              description:
                "We will send you a manage subscription link to this email.",
              fieldType: FormFieldSchemaType.Email,
              required: true,
              placeholder: "email@yourcompany.com",
              disableSpellCheck: true,
            },
          ]}
          createOrUpdateApiUrl={URL.fromString(
            STATUS_PAGE_API_URL.toString(),
          ).addRoute(`/manage-subscription/${id.toString()}`)}
          requestHeaders={API.getDefaultHeaders(
            StatusPageUtil.getStatusPageId()!,
          )}
          formType={FormType.Create}
          submitButtonText={"Send Management Link"}
          onBeforeCreate={async (item: StatusPageSubscriber) => {
            const id: ObjectID = LocalStorage.getItem(
              "statusPageId",
            ) as ObjectID;
            if (!id) {
              throw new BadDataException("Status Page ID is required");
            }

            item.statusPageId = id;
            return item;
          }}
          onSuccess={() => {
            setIsSuccess(true);
          }}
          maxPrimaryButtonWidth={true}
        />
      );
    };

  return (
    <Page
      title={"Subscribe"}
      breadcrumbLinks={[
        {
          title: "Overview",
          to: RouteUtil.populateRouteParams(
            StatusPageUtil.isPreviewPage()
              ? (RouteMap[PageMap.PREVIEW_OVERVIEW] as Route)
              : (RouteMap[PageMap.OVERVIEW] as Route),
          ),
        },
        {
          title: "Subscribe",
          to: RouteUtil.populateRouteParams(
            StatusPageUtil.isPreviewPage()
              ? (RouteMap[PageMap.PREVIEW_SUBSCRIBE_EMAIL] as Route)
              : (RouteMap[PageMap.SUBSCRIBE_EMAIL] as Route),
          ),
        },
      ]}
      sideMenu={
        <SubscribeSideMenu
          isPreviewStatusPage={Boolean(StatusPageUtil.isPreviewPage())}
          enableEmailSubscribers={props.enableEmailSubscribers}
          enableSMSSubscribers={props.enableSMSSubscribers}
          enableSlackSubscribers={props.enableSlackSubscribers}
        />
      }
    >
      {isLaoding ? <PageLoader isVisible={isLaoding} /> : <></>}

      {error ? <ErrorMessage message={error} /> : <></>}

      {!isLaoding && !error ? (
        <div className="justify-center">
          <div>
            {isSuccess && (
              <p className="text-center text-gray-400 mb-20 mt-20">
                {" "}
                An email with the link has been sent to your email. If you
                don&apos;t see the email, please check your spam folder.{" "}
              </p>
            )}

            {!isSuccess ? (
              <div className="">
                <Card
                  title="Subscribe by Email"
                  description={
                    "All of our updates will be sent to this email address."
                  }
                >
                  <Tabs
                    tabs={[
                      {
                        name: "New Subscription",
                        children: getNewSubscriptionContentElement(),
                      },
                      {
                        name: "Manage Existing Subscription",
                        children: getManageExistingSubscriptionContentElement(),
                      },
                    ]}
                    onTabChange={() => {}}
                  />
                </Card>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      ) : (
        <></>
      )}
    </Page>
  );
};

export default SubscribePage;
