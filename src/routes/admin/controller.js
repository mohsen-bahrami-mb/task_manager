// require modules
const Controller = require('../controller');
const bcrypt = require('bcrypt');

module.exports = new (class extends Controller {

    async getUaers(req, res) {
        const users = await this.User.find();
        this.response({ res, message: "get all users", sCode: 200, data: { users } });
    }

    async createUser(req, res) {
        let { email, name, password } = req.body;
        // check, email has existed on database
        const existedUser = await this.User.findOne({ email });
        if (existedUser) return this.response({ res, sCode: 400, message: "this user has already been" });
        // change password to hash
        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);
        // set new user on database
        const user = await new this.User({
            email,
            name,
            password,
            is_admin: false,
            login_expireAt: new Date(),
            image_url: "",
            tasks: []
        });
        await user.save();
        // send response
        this.response({ res, message: "new user", sCode: 200, data: user });
    }

    async editUser(req, res) {
        // find user email on database
        const email = req.params.email;
        const editUser = await this.User.findOne({ email });
        if (!editUser) return this.response({ res, sCode: 404, message: "not found user email in parameter" });
        // get detail of body
        let { new_email, new_name, new_password, new_is_admin, new_image_url, new_tasks } = req.body;
        // check, email has existed on database
        const existedUser = await this.User.findOne({ email: new_email });
        if (existedUser && email != existedUser.email)
            return this.response({ res, sCode: 400, message: "this user has already been" });
        // change password to hash
        const salt = await bcrypt.genSalt(10);
        new_password = await bcrypt.hash(new_password, salt);
        // check tasks id is currect. then add to new tasks.
        let oldTasksUser = [...editUser.tasks];
        let newTasksUser = [];
        await Promise.all(new_tasks.forEach(async (t) => {
            if (oldTasksUser.indexOf(t)) return newTasksUser.push(t);
            const isExistTask = await this.Task.findById(t);
            if (isExistTask) return newTasksUser.push(t);
            this.response({ res, sCode: 404, message: `cannot find task id: ${t}` });
        }));
        // set changes user on database
        editUser.set({
            email: new_email,
            name: new_name,
            password: new_password,
            is_admin: new_is_admin,
            image_url: new_image_url,
            tasks: newTasksUser
        });
        await editUser.save();
        // send response
        this.response({ res, message: "change user details", sCode: 200, data: editUser });
    }

})();