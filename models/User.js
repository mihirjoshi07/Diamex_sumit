const Contact=require("./contact")
const mongoose=require("mongoose");
const userSchema = new mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        unique:true,
        ref: "Contact",
        validate: {
            validator: async function (value) {
                const userId = await Contact.findById(value);
                return userId !== null;
            },
            message: "Contact ID does not exist"
        }   
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    business_category:{type:String,enum:['Manufacturer','Trader','Broker'],required:true},
    companyName: { type: String },
    email: { type: String, required: true, unique: true },  
    bio: { type: String },
    location: { type: String, required: true },
    address: { type: String, required: true },
    preference: { type: String, required: true },
    profilePicture:{type:String},
    notifications:[{
     //all the fields which will be displayed in notification
    }],
    likedDemands:[
      {
        type:mongoose.SchemaTypes.ObjectId,
        unique:true,
        ref:"Demand",
        default:[]
      }
    ],
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending', 'N/A'],
      default: 'N/A',
  },
}, { timestamps: true });

userSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
      next(new Error('User profile already exists, You can edit it'));
    } else {
      next(error);
    }
  });

module.exports = mongoose.model("User", userSchema);