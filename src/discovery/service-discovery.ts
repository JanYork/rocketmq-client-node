import IGrpcServiceDiscovery from "@/interface/grpc-discovery.interface";
import {IGrpcConfig} from "@/interface/grpc-config.interface";

/**
 * Default service discovery implementation
 *
 * @export
 * @class DefaultServiceDiscovery
 * @implements {IGrpcServiceDiscovery}
 */
export default class DefaultServiceDiscovery implements IGrpcServiceDiscovery {
    /**
     * Creates an instance of DefaultServiceDiscovery.
     * @private
     */
    private config: IGrpcConfig;

    constructor(config: IGrpcConfig) {
        this.config = config;
    }

    /**
     * Discover service
     *
     * @returns {Promise<{ host: string; port: number }>} Service host and port
     */
    async discoverService(): Promise<{ host: string; port: number }> {
        try {
            return { host: this.config.host, port: this.config.port };
        } catch (error) {
            console.error('Failed to discover service', error);
            throw new Error('Service discovery failed');
        }
    }
}
