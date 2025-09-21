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
	} | {
		valueType: "socketDataAttribute"
		dataKey?: string
	}
)

export type MethodArgValueType = MethodArgMetadata["valueType"]