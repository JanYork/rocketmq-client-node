"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStringSipHash24 = exports.sha1CheckSum = exports.md5CheckSum = exports.crc32CheckSum = exports.createResource = exports.createDuration = exports.sign = exports.getRequestDateTime = exports.getTimestamp = exports.MASTER_BROKER_ID = void 0;
const node_perf_hooks_1 = require("node:perf_hooks");
const node_crypto_1 = require("node:crypto");
const duration_pb_1 = require("google-protobuf/google/protobuf/duration_pb");
const crc32_1 = require("@node-rs/crc32");
const siphash24_1 = __importDefault(require("siphash24"));
const definition_pb_1 = require("../rpc/apache/rocketmq/v2/definition_pb");
exports.MASTER_BROKER_ID = 0;
function getTimestamp() {
    const timestamp = node_perf_hooks_1.performance.timeOrigin + node_perf_hooks_1.performance.now();
    const seconds = Math.floor(timestamp / 1000);
    const nanos = Math.floor((timestamp % 1000) * 1e6);
    return { seconds, nanos, timestamp };
}
exports.getTimestamp = getTimestamp;
function getRequestDateTime() {
    const now = new Date().toISOString().split('.')[0].replace(/[-:]/g, '');
    return `${now}Z`;
}
exports.getRequestDateTime = getRequestDateTime;
function sign(accessSecret, dateTime) {
    const hmacSha1 = (0, node_crypto_1.createHmac)('sha1', accessSecret);
    hmacSha1.update(dateTime);
    return hmacSha1.digest('hex').toUpperCase();
}
exports.sign = sign;
function createDuration(ms) {
    const nanos = (ms % 1000) * 1000000;
    return new duration_pb_1.Duration().setSeconds(ms / 1000).setNanos(nanos);
}
exports.createDuration = createDuration;
function createResource(name) {
    return new definition_pb_1.Resource().setName(name);
}
exports.createResource = createResource;
function crc32CheckSum(bytes) {
    return `${(0, crc32_1.crc32)(bytes)}`;
}
exports.crc32CheckSum = crc32CheckSum;
function md5CheckSum(bytes) {
    return (0, node_crypto_1.createHash)('md5').update(bytes).digest('hex').toUpperCase();
}
exports.md5CheckSum = md5CheckSum;
function sha1CheckSum(bytes) {
    return (0, node_crypto_1.createHash)('sha1').update(bytes).digest('hex').toUpperCase();
}
exports.sha1CheckSum = sha1CheckSum;
const SIP_HASH_24_KEY = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
    0x0d, 0x0e, 0x0f
]);
function calculateStringSipHash24(value) {
    const hash = (0, siphash24_1.default)(Buffer.from(value), SIP_HASH_24_KEY);
    return Buffer.from(hash).readBigUInt64BE();
}
exports.calculateStringSipHash24 = calculateStringSipHash24;
