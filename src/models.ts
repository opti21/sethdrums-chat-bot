// import { Schema, model } from "mongoose";
// 
// export interface IQueue {
//   id?: string;
//   order: string[];
//   is_updating: boolean;
//   being_updated_by: string;
// }
// 
// const queueSchema = new Schema<IQueue>({
//   order: [{ type: String }],
//   is_updating: { type: Boolean },
//   being_updated_by: { type: String },
// });
// 
// export const QueueModel = model<IQueue>("Queue", queueSchema);
// 
// //////////////////////
// 
// export interface IVideo {
//   id?: string;
//   youtube_id: string;
//   title: string;
//   channel: string;
//   thumbnail: string;
//   region_blocked: boolean;
//   embed_blocked: boolean;
//   duration: number;
//   notes: string;
//   banned: boolean;
// }
// 
// const videoSchema = new Schema<IVideo>({
//   youtube_id: { type: String, required: true },
//   title: { type: String, required: true },
//   channel: { type: String, required: true },
//   thumbnail: { type: String, required: true },
//   region_blocked: { type: Boolean, required: true, default: false },
//   embed_blocked: { type: Boolean, required: true, default: false },
//   duration: { type: Number, required: true },
//   notes: { type: String },
//   banned: { type: Boolean, required: true, default: false },
// });
// 
// export const VideoModel = model<IVideo>("Video", videoSchema);
// 
// ///////////////////
// 
// export interface IRequest {
//   id?: string;
//   requested_by: string;
//   video_id: string;
//   queue_id: string;
//   played: boolean;
//   played_at: Date;
// }
// 
// const requestSchema = new Schema<IRequest>({
//   requested_by: { type: String, required: true },
//   video_id: {type: String, required: true},
//   queue_id: {
//     type: String,
//     required: true,
//     default: "621198287caffa6dcf9e2492",
//   },
//   played: { type: Boolean, required: true, default: false },
//   played_at: { type: Date },
// });
// 
// export const RequestModel = model<IRequest>("Request", requestSchema);
// 
// ///////////////////
// 
// 
// interface IPgStatus {
//   id?: string;
//   video: IVideo;
//   status: Status;
//   checker: string;
//   previous_status: string;
//   previous_checker: string;
//   last_checked: number;
// }
// 
// export enum Status {
//   NotChecked = "NOT_CHECKED",
//   BeingChecked = "BEING_CHECKED",
//   PG = "PG",
//   NonPG = "NON_PG",
// }
// 
// const pgStatusSchema = new Schema<IPgStatus>({
//   video: videoSchema,
//   status: {
//     type: String,
//     enum: Object.values(Status),
//     default: Status.NotChecked,
//   },
//   checker: { type: String },
//   previous_status: String,
//   previous_checker: String,
//   last_checked: Date,
// });
// 
// export const PgStatusModel = model<IPgStatus>("PgStatus", pgStatusSchema);
