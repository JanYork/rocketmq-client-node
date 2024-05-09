/**
 * GRPC服务发现接口
 *
 * @export
 * @interface IGrpcServiceDiscovery
 * @method discoverService - Discover service
 * @author JanYork
 * @email <747945307@qq.com>
 * @date 2024/5/6 下午4:29
 */
interface IGrpcServiceDiscovery {
  /**
   * 发现服务
   *
   * @param serviceName - Name of the service
   * @returns {Promise<{ host: string, port: number }>} - Host and port of the service
   */
  discoverService(serviceName: string): Promise<{ host: string; port: number }>;
}

export default IGrpcServiceDiscovery;
