import { IsBillingEnabled } from "../EnvironmentConfig";
import CreateBy from "../Types/Database/CreateBy";
import DeleteBy from "../Types/Database/DeleteBy";
import { OnCreate, OnDelete } from "../Types/Database/Hooks";
import logger from "../Utils/Logger";
import CallService from "./CallService";
import DatabaseService from "./DatabaseService";
import ProjectService from "./ProjectService";
import UserNotificationRuleService from "./UserNotificationRuleService";
import CallRequest from "../../Types/Call/CallRequest";
import LIMIT_MAX from "../../Types/Database/LimitMax";
import BadDataException from "../../Types/Exception/BadDataException";
import ObjectID from "../../Types/ObjectID";
import Text from "../../Types/Text";
import Project from "Common/Models/DatabaseModels/Project";
import Model from "Common/Models/DatabaseModels/UserCall";
import CaptureSpan from "../Utils/Telemetry/CaptureSpan";

export class Service extends DatabaseService<Model> {
  public constructor() {
    super(Model);
  }

  @CaptureSpan()
  protected override async onBeforeDelete(
    deleteBy: DeleteBy<Model>,
  ): Promise<OnDelete<Model>> {
    const itemsToDelete: Array<Model> = await this.findBy({
      query: deleteBy.query,
      select: {
        _id: true,
        projectId: true,
      },
      skip: 0,
      limit: LIMIT_MAX,
      props: {
        isRoot: true,
      },
    });

    for (const item of itemsToDelete) {
      await UserNotificationRuleService.deleteBy({
        query: {
          userCallId: item.id!,
          projectId: item.projectId!,
        },
        limit: LIMIT_MAX,
        skip: 0,
        props: {
          isRoot: true,
        },
      });
    }

    return {
      deleteBy,
      carryForward: null,
    };
  }

  @CaptureSpan()
  protected override async onBeforeCreate(
    createBy: CreateBy<Model>,
  ): Promise<OnCreate<Model>> {
    if (!createBy.props.isRoot && createBy.data.isVerified) {
      throw new BadDataException("isVerified cannot be set to true");
    }

    // check if this project has SMS and Call mEnabled.

    const project: Project | null = await ProjectService.findOneById({
      id: createBy.data.projectId!,
      props: {
        isRoot: true,
      },
      select: {
        enableCallNotifications: true,
        smsOrCallCurrentBalanceInUSDCents: true,
      },
    });

    if (!project) {
      throw new BadDataException("Project not found");
    }

    if (!project.enableCallNotifications) {
      throw new BadDataException(
        "Call notifications are disabled for this project. Please enable them in Project Settings > Notification Settings.",
      );
    }

    if (
      (project.smsOrCallCurrentBalanceInUSDCents as number) <= 100 &&
      IsBillingEnabled
    ) {
      throw new BadDataException(
        "Your SMS balance is low. Please recharge your SMS balance in Project Settings > Notification Settings.",
      );
    }

    return { carryForward: null, createBy };
  }

  @CaptureSpan()
  protected override async onCreateSuccess(
    _onCreate: OnCreate<Model>,
    createdItem: Model,
  ): Promise<Model> {
    if (!createdItem.isVerified) {
      this.sendVerificationCode(createdItem);
    }
    return createdItem;
  }

  @CaptureSpan()
  public async resendVerificationCode(itemId: ObjectID): Promise<void> {
    const item: Model | null = await this.findOneById({
      id: itemId,
      props: {
        isRoot: true,
      },
      select: {
        phone: true,
        verificationCode: true,
        isVerified: true,
        projectId: true,
      },
    });

    if (!item) {
      throw new BadDataException(
        "Item with ID " + itemId.toString() + " not found",
      );
    }

    if (item.isVerified) {
      throw new BadDataException("Phone Number already verified");
    }

    // generate new verification code
    item.verificationCode = Text.generateRandomNumber(6);

    await this.updateOneById({
      id: item.id!,
      props: {
        isRoot: true,
      },
      data: {
        verificationCode: item.verificationCode,
      },
    });

    this.sendVerificationCode(item);
  }

  public sendVerificationCode(item: Model): void {
    const callRequest: CallRequest = {
      to: item.phone!,
      data: [
        {
          sayMessage: "This call is from One Uptime.",
        },
        {
          sayMessage:
            "Your verification code is " +
            item.verificationCode?.split("").join("  "), // add space to make it more clear and slow down the message
        },
        {
          sayMessage:
            "Your verification code is " +
            item.verificationCode?.split("").join("  "), // add space to make it more clear and slow down the message
        },
        {
          sayMessage:
            "Your verification code is " +
            item.verificationCode?.split("").join("  "), // add space to make it more clear and slow down the message
        },
        {
          sayMessage: "Thank you for using One Uptime. Goodbye.",
        },
      ],
    };

    // send verification sms.
    CallService.makeCall(callRequest, {
      projectId: item.projectId,
      isSensitive: true,
    }).catch((err: Error) => {
      logger.error(err);
    });
  }
}

export default new Service();
