const mongoose=require("mongoose");

const currencyRatesSchema=new mongoose.Schema({
    currencyDescription:{type:String, default:"USD TO INR"},
    rate:{type:Number}
},{timestamps:true})

module.exports=mongoose.model("CurrencyRates",currencyRatesSchema);