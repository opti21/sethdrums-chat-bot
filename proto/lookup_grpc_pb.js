// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var proto_lookup_pb = require('../proto/lookup_pb.js');

function serialize_onethirtyone_ContentLookup(arg) {
  if (!(arg instanceof proto_lookup_pb.ContentLookup)) {
    throw new Error('Expected argument of type onethirtyone.ContentLookup');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_onethirtyone_ContentLookup(buffer_arg) {
  return proto_lookup_pb.ContentLookup.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_onethirtyone_VideoDetails(arg) {
  if (!(arg instanceof proto_lookup_pb.VideoDetails)) {
    throw new Error('Expected argument of type onethirtyone.VideoDetails');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_onethirtyone_VideoDetails(buffer_arg) {
  return proto_lookup_pb.VideoDetails.deserializeBinary(new Uint8Array(buffer_arg));
}


var VideoDetailsServiceService = exports.VideoDetailsServiceService = {
  lookup: {
    path: '/onethirtyone.VideoDetailsService/lookup',
    requestStream: false,
    responseStream: false,
    requestType: proto_lookup_pb.ContentLookup,
    responseType: proto_lookup_pb.VideoDetails,
    requestSerialize: serialize_onethirtyone_ContentLookup,
    requestDeserialize: deserialize_onethirtyone_ContentLookup,
    responseSerialize: serialize_onethirtyone_VideoDetails,
    responseDeserialize: deserialize_onethirtyone_VideoDetails,
  },
};

exports.VideoDetailsServiceClient = grpc.makeGenericClientConstructor(VideoDetailsServiceService);
