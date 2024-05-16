#!/bin/bash
# generate_grpc.sh

# 定义两个输出目录，一个是源代码目录，另一个是分发目录
OUTPUT_DIR_SRC="./rpc"
OUTPUT_DIR_DIST="./lib/rpc"

# 确保两个输出目录都存在
mkdir -p ${OUTPUT_DIR_SRC}
mkdir -p ${OUTPUT_DIR_DIST}

# 定义proto文件所在目录，相对于脚本运行目录的路径
PROTO_DIR="./proto"

# 检查proto目录是否存在
if [ ! -d "${PROTO_DIR}" ]; then
  echo "Directory ${PROTO_DIR} does not exist."
  exit 1
fi

# 通过find命令遍历所有.proto文件，支持任意层次的嵌套
find ${PROTO_DIR} -name "*.proto" -print0 | while IFS= read -r -d $'\0' PROTO_FILE; do
    echo "processing ${PROTO_FILE}"
    # 执行grpc_tools_node_protoc命令，生成到源代码目录
    grpc_tools_node_protoc --js_out=import_style=commonjs,binary:${OUTPUT_DIR_SRC} \
                           --grpc_out=grpc_js:${OUTPUT_DIR_SRC} \
                           --plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \
                           --ts_out=grpc_js:${OUTPUT_DIR_SRC} \
                           -I "${PROTO_DIR}" \
                           "${PROTO_FILE}"

    # 复制生成的文件到分发目录
    cp -r ${OUTPUT_DIR_SRC}/* ${OUTPUT_DIR_DIST}/
done

echo "files have been generated and copied to both ${OUTPUT_DIR_SRC} and ${OUTPUT_DIR_DIST}."
