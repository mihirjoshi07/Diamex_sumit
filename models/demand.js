const { default: mongoose } = require("mongoose");
const Contact=require("./contact")

const demandSchema = new mongoose.Schema({
    growthType:{type:String},
    Type: { type: String, required: true, enum: ['Natural', 'Lab Grown'] },
    category: { type: String, enum: ['Parcel', 'Single Non Certified','Single Certified'] },
   
    shape: { type: [String], required: true },
    size: { type: [String], required: true },
    color: { type: [String], required: true },
    intensity: { type: [String] },
    clarity: { type: [String], required: true },
    price_ct_min: { type: String, required: true },
    price_ct_max: { type: String, required: true },
    Natts: { type: [String] },
    Location: { type: String, required: true },
    Note: { type: String,default:"N/A" },
    Terms: { type: String ,default:"N/A"},
    Cut: { type: String },
    mmL: { type: Number },
    mmW: { type: Number },
    Flourence: { type: [String] },
    Expiry: { type: Date, required: true },
    // This postExpiryDate Field is used to store the expiry + 15 days so after 15 days of expiry it will delete from the db 
    postExpiryDate:{type:Date},
    imageUrl1: { type: String },
    imageUrl2:{type:String},
    imageUrl3:{type:String},
    BGM: { type: String },
    Labs: { type: [String] },
    status:{type:String},
    fetchTime: { type: String, default: () => new Date().toISOString() },
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Contact",
        validate: {
            validator: async function (value) { 
                const userId = await Contact.findById(value);
                return userId !== null;
            },
            message: "user ID does not exist"
        }
    }
}, { timestamps: true });

const demandModel=mongoose.model("Demand",demandSchema);
module.exports=demandModel;