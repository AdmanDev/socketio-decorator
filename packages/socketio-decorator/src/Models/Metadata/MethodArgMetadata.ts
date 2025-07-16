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
	} | {
		valueType: "currentUser"
	}
)

export type MethodArgValueType = MethodArgMetadata["valueType"]