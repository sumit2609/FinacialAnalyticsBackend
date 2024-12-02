const express = require("express")
const cors = require("cors");
const dotenv = require("dotenv").config()
//const data = require("./transactions.json");
const { getBalance, getPaginatedData, getRecentTransaction, resetTime, getAnalytics } = require("./controllers/calculation.controller");
const app = express();


app.use(express.json());
app.use(cors());

//get all transactions
app.get("/api/transactions", async (req,res) => {
    const {page = 1, limit = 10, startDate, endDate, name, status} = req.query;
    
    //pagination logic
    const pageNumber = parseInt(page,10);
    const pagelimit = parseInt(limit,10);

    let filter = {};
    //name filter
    if(name){
        filter.user_id = { $regex: name, $options: 'i' };
    }

    if(status){
        filter.status=status;
    }
    //date filter logic
    if(startDate && endDate){

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if(isNaN(parsedStartDate)||isNaN(parsedEndDate)){
            return res.status(400).json({ error: 'Invalid start or end date format. Use YYYY-MM-DD.' });
        }
        filter.dateObject = {
            $gte: parsedStartDate,
            $lte: parsedEndDate
        }
    }
    try{
        const {results,totalCount} = await getPaginatedData(pageNumber,pagelimit,filter);
        const totalPages = Math.ceil(totalCount/pagelimit);

        res.status(200).json({
            page:pageNumber,
            limit:pagelimit,
            totalPages,
            totalCount,
            data:results,
        });
    }catch(err){
        res.status(500).json({error:'Error in geting data'});
    }
});
//get top 3 transactions from database
app.get("/api/recentTransaction", async (req,res)=>{
    const limit = parseInt(req.query.limit, 10)||3
    try{
        const {documents} = await getRecentTransaction(limit);
        res.status(200).json({
            data:documents
        })
    }catch(err){
        res.status(500).json({error:'Error in geting data'});
    }
})

//get total expense cost
app.get("/api/totalExpense", async (req,res) => {
    try{
        const expense = await getBalance('Expense');
        res.status(200).json({
            data:{
                totalExpense: expense,
                success: true
            }
        });
    }catch(err){
        res.status(500).json({
            error:{
                success:false,
                error:err
            }
        })
    }
    
});

//get total revenue
app.get("/api/totalRevenue", async (req,res) => {
    const {type} = req.query;
    //console.log(req.query)
    if(!type){
        res.status(500).json({
            error:{
                success:false,
                error:err
            }
        })
    }
    try{
        const revenue = await getBalance('Revenue');
        const expense = await getBalance('Expense');

        let result;
        console.log(type)
        if(type === 'Revenue'){
            result = revenue;
        }
        if(type === 'Expense'){
            result = expense;
        }
        if(type === 'Balance' || type ==='Saving'){
            result = revenue-expense;
        }
        console.log(result)
        res.status(200).json({
            data:{
                totalExpense: result,
                success: true
            }
        });
    }catch(err){
        res.status(500).json({
            error:{
                success:false,
                error:err
            }
        })
    }
});

app.get("/api/analytics", async (req,res) =>{
    const {year} = req.query;

    if (!year || isNaN(year)) {
        return res.status(400).json({ error: 'Invalid or missing year parameter' });
    }
    const yearInt = parseInt(year);
    console.log(yearInt)
    try{
        const results = await getAnalytics(yearInt);
        //_id is month number
        const formattedResults = results.map((item) => ({
            month: item._id,
            Revenue: item.details.find((d) => d.category === "Revenue")?.amount || 0,
            Expense: item.details.find((d) => d.category === "Expense")?.amount || 0,
        }));

        console.log(formattedResults)
        res.status(200).json(formattedResults);
    }catch(err){
        res.status(500).json({
            error:{
                success:false,
                error:err
            }
        })
    }
});

const port = process.env.PORT||5000
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
});