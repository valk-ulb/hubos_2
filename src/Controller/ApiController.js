

export default class ApiController{
    constructor(){

    }


    async createAdmin(req, res) {
        const newAdmin = {
            username : req.body.username,
            password : req.body.password
        }
        if (!newAdmin.username || !newAdmin.password){
            res.status(400).json({'message': 'Username and password are required'})
        }
        res.status(201).json({status:'yes'})
    }

    async modifyAdmin(req, res) {
        res.json({status:'yes'})
    }


}