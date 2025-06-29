export type MethodArgMetadata = {
	parameterIndex: number
} & (
	{
		valueType: "socket"
	} | {
		valueType: "data"
		dataIndex: number
	} | {
		valueType: "eventName"
	}
)

export type MethodArgValueType = MethodArgMetadata["valueType"]