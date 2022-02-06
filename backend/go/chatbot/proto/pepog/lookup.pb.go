// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.26.0
// 	protoc        (unknown)
// source: proto/lookup.proto

package proto

import (
	reflect "reflect"
	sync "sync"

	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type ContentLookup struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Id      string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`                          // TrackID UUID
	VideoId string `protobuf:"bytes,2,opt,name=video_id,json=videoId,proto3" json:"video_id,omitempty"` // Youtube Video ID
	Region  string `protobuf:"bytes,3,opt,name=region,proto3" json:"region,omitempty"`                  // ISO-3166-1 Alpha-2 code
}

func (x *ContentLookup) Reset() {
	*x = ContentLookup{}
	if protoimpl.UnsafeEnabled {
		mi := &file_proto_lookup_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ContentLookup) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ContentLookup) ProtoMessage() {}

func (x *ContentLookup) ProtoReflect() protoreflect.Message {
	mi := &file_proto_lookup_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ContentLookup.ProtoReflect.Descriptor instead.
func (*ContentLookup) Descriptor() ([]byte, []int) {
	return file_proto_lookup_proto_rawDescGZIP(), []int{0}
}

func (x *ContentLookup) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

func (x *ContentLookup) GetVideoId() string {
	if x != nil {
		return x.VideoId
	}
	return ""
}

func (x *ContentLookup) GetRegion() string {
	if x != nil {
		return x.Region
	}
	return ""
}

type VideoDetails struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Id            string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`                                             // TrackID UUID
	Title         string `protobuf:"bytes,2,opt,name=title,proto3" json:"title,omitempty"`                                       // Video title
	Channel       string `protobuf:"bytes,3,opt,name=channel,proto3" json:"channel,omitempty"`                                   // Channel name
	RegionBlocked bool   `protobuf:"varint,4,opt,name=region_blocked,json=regionBlocked,proto3" json:"region_blocked,omitempty"` // Is region blocked for specified region
	EmbedBlocked  bool   `protobuf:"varint,5,opt,name=embed_blocked,json=embedBlocked,proto3" json:"embed_blocked,omitempty"`    // Is blocked for embedded players
	Duration      int64  `protobuf:"varint,6,opt,name=duration,proto3" json:"duration,omitempty"`                                // Duration in Seconds
}

func (x *VideoDetails) Reset() {
	*x = VideoDetails{}
	if protoimpl.UnsafeEnabled {
		mi := &file_proto_lookup_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *VideoDetails) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*VideoDetails) ProtoMessage() {}

func (x *VideoDetails) ProtoReflect() protoreflect.Message {
	mi := &file_proto_lookup_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use VideoDetails.ProtoReflect.Descriptor instead.
func (*VideoDetails) Descriptor() ([]byte, []int) {
	return file_proto_lookup_proto_rawDescGZIP(), []int{1}
}

func (x *VideoDetails) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

func (x *VideoDetails) GetTitle() string {
	if x != nil {
		return x.Title
	}
	return ""
}

func (x *VideoDetails) GetChannel() string {
	if x != nil {
		return x.Channel
	}
	return ""
}

func (x *VideoDetails) GetRegionBlocked() bool {
	if x != nil {
		return x.RegionBlocked
	}
	return false
}

func (x *VideoDetails) GetEmbedBlocked() bool {
	if x != nil {
		return x.EmbedBlocked
	}
	return false
}

func (x *VideoDetails) GetDuration() int64 {
	if x != nil {
		return x.Duration
	}
	return 0
}

var File_proto_lookup_proto protoreflect.FileDescriptor

var file_proto_lookup_proto_rawDesc = []byte{
	0x0a, 0x12, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x2f, 0x6c, 0x6f, 0x6f, 0x6b, 0x75, 0x70, 0x2e, 0x70,
	0x72, 0x6f, 0x74, 0x6f, 0x12, 0x0c, 0x6f, 0x6e, 0x65, 0x74, 0x68, 0x69, 0x72, 0x74, 0x79, 0x6f,
	0x6e, 0x65, 0x22, 0x52, 0x0a, 0x0d, 0x43, 0x6f, 0x6e, 0x74, 0x65, 0x6e, 0x74, 0x4c, 0x6f, 0x6f,
	0x6b, 0x75, 0x70, 0x12, 0x0e, 0x0a, 0x02, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x02, 0x69, 0x64, 0x12, 0x19, 0x0a, 0x08, 0x76, 0x69, 0x64, 0x65, 0x6f, 0x5f, 0x69, 0x64, 0x18,
	0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x76, 0x69, 0x64, 0x65, 0x6f, 0x49, 0x64, 0x12, 0x16,
	0x0a, 0x06, 0x72, 0x65, 0x67, 0x69, 0x6f, 0x6e, 0x18, 0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06,
	0x72, 0x65, 0x67, 0x69, 0x6f, 0x6e, 0x22, 0xb6, 0x01, 0x0a, 0x0c, 0x56, 0x69, 0x64, 0x65, 0x6f,
	0x44, 0x65, 0x74, 0x61, 0x69, 0x6c, 0x73, 0x12, 0x0e, 0x0a, 0x02, 0x69, 0x64, 0x18, 0x01, 0x20,
	0x01, 0x28, 0x09, 0x52, 0x02, 0x69, 0x64, 0x12, 0x14, 0x0a, 0x05, 0x74, 0x69, 0x74, 0x6c, 0x65,
	0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x05, 0x74, 0x69, 0x74, 0x6c, 0x65, 0x12, 0x18, 0x0a,
	0x07, 0x63, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x18, 0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07,
	0x63, 0x68, 0x61, 0x6e, 0x6e, 0x65, 0x6c, 0x12, 0x25, 0x0a, 0x0e, 0x72, 0x65, 0x67, 0x69, 0x6f,
	0x6e, 0x5f, 0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x65, 0x64, 0x18, 0x04, 0x20, 0x01, 0x28, 0x08, 0x52,
	0x0d, 0x72, 0x65, 0x67, 0x69, 0x6f, 0x6e, 0x42, 0x6c, 0x6f, 0x63, 0x6b, 0x65, 0x64, 0x12, 0x23,
	0x0a, 0x0d, 0x65, 0x6d, 0x62, 0x65, 0x64, 0x5f, 0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x65, 0x64, 0x18,
	0x05, 0x20, 0x01, 0x28, 0x08, 0x52, 0x0c, 0x65, 0x6d, 0x62, 0x65, 0x64, 0x42, 0x6c, 0x6f, 0x63,
	0x6b, 0x65, 0x64, 0x12, 0x1a, 0x0a, 0x08, 0x64, 0x75, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x18,
	0x06, 0x20, 0x01, 0x28, 0x03, 0x52, 0x08, 0x64, 0x75, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x32,
	0x58, 0x0a, 0x13, 0x56, 0x69, 0x64, 0x65, 0x6f, 0x44, 0x65, 0x74, 0x61, 0x69, 0x6c, 0x73, 0x53,
	0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x41, 0x0a, 0x06, 0x6c, 0x6f, 0x6f, 0x6b, 0x75, 0x70,
	0x12, 0x1b, 0x2e, 0x6f, 0x6e, 0x65, 0x74, 0x68, 0x69, 0x72, 0x74, 0x79, 0x6f, 0x6e, 0x65, 0x2e,
	0x43, 0x6f, 0x6e, 0x74, 0x65, 0x6e, 0x74, 0x4c, 0x6f, 0x6f, 0x6b, 0x75, 0x70, 0x1a, 0x1a, 0x2e,
	0x6f, 0x6e, 0x65, 0x74, 0x68, 0x69, 0x72, 0x74, 0x79, 0x6f, 0x6e, 0x65, 0x2e, 0x56, 0x69, 0x64,
	0x65, 0x6f, 0x44, 0x65, 0x74, 0x61, 0x69, 0x6c, 0x73, 0x42, 0x19, 0x5a, 0x17, 0x31, 0x33, 0x31,
	0x2e, 0x74, 0x6f, 0x6f, 0x6c, 0x73, 0x2f, 0x76, 0x69, 0x64, 0x65, 0x6f, 0x5f, 0x64, 0x65, 0x74,
	0x61, 0x69, 0x6c, 0x73, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_proto_lookup_proto_rawDescOnce sync.Once
	file_proto_lookup_proto_rawDescData = file_proto_lookup_proto_rawDesc
)

func file_proto_lookup_proto_rawDescGZIP() []byte {
	file_proto_lookup_proto_rawDescOnce.Do(func() {
		file_proto_lookup_proto_rawDescData = protoimpl.X.CompressGZIP(file_proto_lookup_proto_rawDescData)
	})
	return file_proto_lookup_proto_rawDescData
}

var file_proto_lookup_proto_msgTypes = make([]protoimpl.MessageInfo, 2)
var file_proto_lookup_proto_goTypes = []interface{}{
	(*ContentLookup)(nil), // 0: onethirtyone.ContentLookup
	(*VideoDetails)(nil),  // 1: onethirtyone.VideoDetails
}
var file_proto_lookup_proto_depIdxs = []int32{
	0, // 0: onethirtyone.VideoDetailsService.lookup:input_type -> onethirtyone.ContentLookup
	1, // 1: onethirtyone.VideoDetailsService.lookup:output_type -> onethirtyone.VideoDetails
	1, // [1:2] is the sub-list for method output_type
	0, // [0:1] is the sub-list for method input_type
	0, // [0:0] is the sub-list for extension type_name
	0, // [0:0] is the sub-list for extension extendee
	0, // [0:0] is the sub-list for field type_name
}

func init() { file_proto_lookup_proto_init() }
func file_proto_lookup_proto_init() {
	if File_proto_lookup_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_proto_lookup_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ContentLookup); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_proto_lookup_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*VideoDetails); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_proto_lookup_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   2,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_proto_lookup_proto_goTypes,
		DependencyIndexes: file_proto_lookup_proto_depIdxs,
		MessageInfos:      file_proto_lookup_proto_msgTypes,
	}.Build()
	File_proto_lookup_proto = out.File
	file_proto_lookup_proto_rawDesc = nil
	file_proto_lookup_proto_goTypes = nil
	file_proto_lookup_proto_depIdxs = nil
}