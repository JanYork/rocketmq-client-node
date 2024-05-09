/**
 * GRPC 配置接口
 *
 * @export
 * @interface IGrpcConfig
 * @property {string} host - Host of the gRPC server
 * @property {number} port - Port of the gRPC server
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:29
 */
interface IGrpcConfig {
  /**
   * 主机IP
   */
  host: string;

  /**
   * 端口号
   */
  port: number;
}

export { IGrpcConfig };
