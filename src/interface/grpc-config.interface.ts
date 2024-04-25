/**
 * Interface for gRPC configuration
 *
 * @export
 * @interface IGrpcConfig
 * @property {string} protoPath - Path to the proto file
 * @property {string} host - Host of the gRPC server
 * @property {number} port - Port of the gRPC server
 */
interface IGrpcConfig {
    host: string;
    port: number;
}


export { IGrpcConfig };
