/**
 * Interface for service discovery
 *
 * @export
 * @interface IGrpcServiceDiscovery
 * @method discoverService - Discover service
 */
interface IGrpcServiceDiscovery {
    /**
     * Discover service
     *
     * @param serviceName - Name of the service
     * @returns {Promise<{ host: string, port: number }>} - Host and port of the service
     */
    discoverService(serviceName: string): Promise<{ host: string, port: number }>;
}

export default IGrpcServiceDiscovery;
