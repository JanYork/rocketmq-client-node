import { performance } from "node:perf_hooks";
import { createHash, createHmac } from "node:crypto";
import { Duration } from "google-protobuf/google/protobuf/duration_pb";
import { crc32 } from "@node-rs/crc32";
import siphash from "siphash24";
import { Resource } from "@/rpc/apache/rocketmq/v2/definition_pb";

// 主节点ID
export const MASTER_BROKER_ID = 0;

/**
 * 获取当前时间戳。
 *
 * @returns 包含秒和纳秒的时间戳对象
 */
export function getTimestamp() {
  const timestamp = performance.timeOrigin + performance.now();
  const seconds = Math.floor(timestamp / 1000);
  const nanos = Math.floor((timestamp % 1000) * 1e6);
  return { seconds, nanos, timestamp };
}

/**
 * 获取请求时间的格式化字符串。
 *
 * @returns 格式化的请求时间字符串
 */
export function getRequestDateTime() {
  // 2023-09-13T06:30:59.399Z => 20230913T063059Z
  const now = new Date().toISOString().split(".")[0].replace(/[-:]/g, "");
  return `${now}Z`;
}

/**
 * 使用 HMAC-SHA1 签名。
 *
 * @param accessSecret 访问密钥
 * @param dateTime 请求时间
 * @returns 签名字符串
 */
export function sign(accessSecret: string, dateTime: string) {
  const hmacSha1 = createHmac("sha1", accessSecret);
  hmacSha1.update(dateTime);
  return hmacSha1.digest("hex").toUpperCase();
}

/**
 * 创建 Duration 对象。
 *
 * @param ms 毫秒数
 * @returns Duration 对象
 */
export function createDuration(ms: number) {
  const nanos = (ms % 1000) * 1000000;
  return new Duration().setSeconds(ms / 1000).setNanos(nanos);
}

/**
 * 创建 Resource 对象。
 *
 * @param name 资源名称
 * @returns Resource 对象
 */
export function createResource(name: string) {
  return new Resource().setName(name);
}

/**
 * 计算 CRC32 校验和。
 *
 * @param bytes 输入的字节数组
 * @returns CRC32 校验和字符串
 */
export function crc32CheckSum(bytes: Buffer) {
  return `${crc32(bytes)}`;
}

/**
 * 计算 MD5 校验和。
 *
 * @param bytes 输入的字节数组
 * @returns MD5 校验和字符串
 */
export function md5CheckSum(bytes: Uint8Array) {
  return createHash("md5").update(bytes).digest("hex").toUpperCase();
}

/**
 * 计算 SHA1 校验和。
 *
 * @param bytes 输入的字节数组
 * @returns SHA1 校验和字符串
 */
export function sha1CheckSum(bytes: Uint8Array) {
  return createHash("sha1").update(bytes).digest("hex").toUpperCase();
}

// SIPHASH_24_KEY，SipHash24 的密钥
const SIP_HASH_24_KEY = Buffer.from([
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
  0x0d, 0x0e, 0x0f,
]);

/**
 * 计算字符串的 SipHash24 哈希值。
 *
 * @param value 输入字符串
 * @returns SipHash24 哈希值
 */
export function calculateStringSipHash24(value: string) {
  const hash = siphash(Buffer.from(value), SIP_HASH_24_KEY);
  return Buffer.from(hash).readBigUInt64BE();
}
