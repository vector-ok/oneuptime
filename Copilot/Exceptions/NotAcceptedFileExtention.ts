import ExceptionCode from "Common/Types/Exception/ExceptionCode";
import CopilotActionProcessingException from "./CopilotActionProcessingException";

export default class NotAcceptedFileExtentionForCopilotAction extends CopilotActionProcessingException {
  public constructor(message: string) {
    super(ExceptionCode.BadDataException, message);
  }
}
