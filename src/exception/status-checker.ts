import { Status, Code } from "@/rpc/apache/rocketmq/v2/definition_pb";
import {
  BadRequestException,
  ForbiddenException,
  InternalErrorException,
  NotFoundException,
  PayloadTooLargeException,
  PaymentRequiredException,
  ProxyTimeoutException,
  RequestHeaderFieldsTooLargeException,
  TooManyRequestsException,
  UnauthorizedException,
  UnsupportedException,
} from "@/exception";

/**
 * 状态检查器
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:37
 */
export class StatusChecker {
  static check(status?: Status.AsObject, requestId?: string) {
    if (!status) return;
    switch (status.code) {
      case Code.OK:
      case Code.MULTIPLE_RESULTS:
        return;
      case Code.BAD_REQUEST:
      case Code.ILLEGAL_ACCESS_POINT:
      case Code.ILLEGAL_TOPIC:
      case Code.ILLEGAL_CONSUMER_GROUP:
      case Code.ILLEGAL_MESSAGE_TAG:
      case Code.ILLEGAL_MESSAGE_KEY:
      case Code.ILLEGAL_MESSAGE_GROUP:
      case Code.ILLEGAL_MESSAGE_PROPERTY_KEY:
      case Code.INVALID_TRANSACTION_ID:
      case Code.ILLEGAL_MESSAGE_ID:
      case Code.ILLEGAL_FILTER_EXPRESSION:
      case Code.ILLEGAL_INVISIBLE_TIME:
      case Code.ILLEGAL_DELIVERY_TIME:
      case Code.INVALID_RECEIPT_HANDLE:
      case Code.MESSAGE_PROPERTY_CONFLICT_WITH_TYPE:
      case Code.UNRECOGNIZED_CLIENT_TYPE:
      case Code.MESSAGE_CORRUPTED:
      case Code.CLIENT_ID_REQUIRED:
      case Code.ILLEGAL_POLLING_TIME:
        throw new BadRequestException(status.code, status.message, requestId);
      case Code.UNAUTHORIZED:
        throw new UnauthorizedException(status.code, status.message, requestId);
      case Code.PAYMENT_REQUIRED:
        throw new PaymentRequiredException(
          status.code,
          status.message,
          requestId,
        );
      case Code.FORBIDDEN:
        throw new ForbiddenException(status.code, status.message, requestId);
      case Code.MESSAGE_NOT_FOUND:
        return;
      case Code.NOT_FOUND:
      case Code.TOPIC_NOT_FOUND:
      case Code.CONSUMER_GROUP_NOT_FOUND:
        throw new NotFoundException(status.code, status.message, requestId);
      case Code.PAYLOAD_TOO_LARGE:
      case Code.MESSAGE_BODY_TOO_LARGE:
        throw new PayloadTooLargeException(
          status.code,
          status.message,
          requestId,
        );
      case Code.TOO_MANY_REQUESTS:
        throw new TooManyRequestsException(
          status.code,
          status.message,
          requestId,
        );
      case Code.REQUEST_HEADER_FIELDS_TOO_LARGE:
      case Code.MESSAGE_PROPERTIES_TOO_LARGE:
        throw new RequestHeaderFieldsTooLargeException(
          status.code,
          status.message,
          requestId,
        );
      case Code.INTERNAL_ERROR:
      case Code.INTERNAL_SERVER_ERROR:
      case Code.HA_NOT_AVAILABLE:
        throw new InternalErrorException(
          status.code,
          status.message,
          requestId,
        );
      case Code.PROXY_TIMEOUT:
      case Code.MASTER_PERSISTENCE_TIMEOUT:
      case Code.SLAVE_PERSISTENCE_TIMEOUT:
        throw new ProxyTimeoutException(status.code, status.message, requestId);
      case Code.UNSUPPORTED:
      case Code.VERSION_UNSUPPORTED:
      case Code.VERIFY_FIFO_MESSAGE_UNSUPPORTED:
        throw new UnsupportedException(status.code, status.message, requestId);
      default:
        throw new UnsupportedException(status.code, status.message, requestId);
    }
  }
}
