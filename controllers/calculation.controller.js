const connectDb = require("../config/dbConnection")

let collections
(async () => {
    try {
        collections = await connectDb()
        console.log("got the collection")
    } catch (error) {
        console.error('Error in getting collection', error);
    }
})();

const resetTime = (date) => {
    const resetDate = new Date(date);
    resetDate.setHours(0, 0, 0, 0); // Set time to 00:00:00
    console.log(resetDate)
    return resetDate;
};

//get transactions
const getPaginatedData = async (page,limit,filter) => {
    //calculate the number of respose we need to skip
    const skip = (page-1)*limit;

    const pipeline =[
        {
            $addFields: {
                dateObject: { $toDate: "$date" }, // Convert string date to Date object
            },
        },
        {
            $match:filter,
        }
    ]

    //get result i.e., the data we need to show on a particular page
    //const result = await collections.find(filter).skip(skip).limit(limit).toArray();
    const totalObject = await collections.aggregate(pipeline).toArray();
    //console.log(results.length)
    const results = await collections.aggregate(pipeline).skip(skip).limit(limit).toArray();
    //console.log(totalObject.length)
    return {
        results,
        totalCount: totalObject.length,
    };
} 

//Get revenue or expense
const getBalance = async (category) => {
    const documents = await collections.find().toArray();
    let finalRes = 0;
    documents.forEach((item) => {
        if(item.category === category){
            finalRes+=item.amount;
        }
    }) 
    return finalRes;
};
//get recent 3 transactions
const getRecentTransaction = async (limit) => {
    //sort data accorting to date in descending order and give limit to 3
    const documents = await collections.find().sort({date:-1}).limit(limit).toArray();
    return {documents};
}
//get analytics
const getAnalytics = async (year) => {
    const pipeline = [
        {
            $addFields: {
                dateObject: { $toDate: "$date" }, // Convert string date to Date object
            },
        },    
        {
            $match:{
                dateObject:{
                    $gte: new Date(`${year}-01-01T00:00:00.000Z`), //start of the year
                    $lte: new Date(`${year}-12-31T23:59:59.999Z`), //end of the year
                },
            },
        },
        {
            $group: {
                _id: {
                    month: { $month: "$dateObject" },
                    category: "$category",
                },
                totalAmount: { $sum: "$amount" },
            },
        },
        {
            $group:{
                _id:{
                    month:"$_id.month",
                },
                details:{
                    $push:{
                        category:"$_id.category",
                        amount:"$totalAmount"
                    },
                },
            },
        },
        {
            $project:{
                _id:"$_id.month",
                details:1,
            },
        },
        {$sort:{_id:1}}
    ];
    //console.log(new Date(`${year}-01-01T00:00:00.000Z`))
    const results = await collections.aggregate(pipeline).toArray();
    console.log(results)
    return results;
}

module.exports = {
    getBalance,
    getPaginatedData,
    getRecentTransaction,
    resetTime,
    getAnalytics
}