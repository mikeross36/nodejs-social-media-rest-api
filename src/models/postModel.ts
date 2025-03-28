import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxLength: [1000, "Post text cannot be more than 1000 characters"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

postSchema.pre(/^find/, function (next) {
  (this as mongoose.Query<any, any>).populate({
    path: "creator",
    select: "userName profileImage",
  });
  next();
});

postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "post",
  localField: "_id",
  justOne: false,
});

const Post = mongoose.model("Post", postSchema);

export default Post;
