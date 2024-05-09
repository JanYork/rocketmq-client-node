import {
  FilterType,
  FilterExpression as FilterExpressionPB
} from '@/rpc/apache/rocketmq/v2/definition_pb';

/**
 * 订阅所有消息
 */
const TAG_EXPRESSION_SUB_ALL = '*';

/**
 * 过滤表达式。
 *
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:56
 */
export class FilterExpression {
  /**
   * 订阅所有消息
   */
  static readonly SUB_ALL = new FilterExpression(TAG_EXPRESSION_SUB_ALL);

  /**
   * 表达式
   */
  readonly expression: string;

  /**
   * 过滤类型
   */
  readonly filterType: FilterType;

  constructor(expression: string, filterType = FilterType.TAG) {
    this.expression = expression;
    this.filterType = filterType;
  }

  toProtobuf() {
    return new FilterExpressionPB()
      .setType(this.filterType)
      .setExpression(this.expression);
  }

  toString() {
    return `FilterExpression(${this.filterType},${this.expression})`;
  }
}
