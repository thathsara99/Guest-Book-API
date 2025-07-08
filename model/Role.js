import mongoose from "mongoose";
const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    descryption: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

const Role = mongoose.model('Role', RoleSchema);

export default Role;