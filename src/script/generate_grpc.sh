#!/bin/bash
# generate_grpc.sh

# 定义输出目录相对于脚本运行目录的路径
OUTPUT_DIR="./src/rpc"

# 确保输出目录存在
mkdir -p ${OUTPUT_DIR}

# 定义proto文件所在目录，相对于脚本运行目录的路径
PROTO_DIR="./src/proto"

# 检查proto目录是否存在
if [ ! -d "${PROTO_DIR}" ]; then
  echo "Directory ${PROTO_DIR} does not exist."
  exit 1
fi

# 通过find命令遍历所有.proto文件，支持任意层次的嵌套
find ${PROTO_DIR} -name "*.proto" -print0 | while IFS= read -r -d $'\0' PROTO_FILE; do
    echo "processing ${PROTO_FILE}"
    # 执行grpc_tools_node_protoc命令
    grpc_tools_node_protoc --js_out=import_style=commonjs,binary:${OUTPUT_DIR} \
                           --grpc_out=grpc_js:${OUTPUT_DIR} \
                           --plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \
                           --ts_out=grpc_js:${OUTPUT_DIR} \
                           -I "${PROTO_DIR}" \
                           "${PROTO_FILE}"
done
