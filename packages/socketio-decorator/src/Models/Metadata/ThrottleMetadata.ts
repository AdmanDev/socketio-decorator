import { MetadataDescription } from "./Metadata"

export type ThrottleMetadata = MetadataDescription & {
	limit: number
	timeWindowMs: number
}

export type ClassThrottleMetadata = Omit<ThrottleMetadata, "methodName">