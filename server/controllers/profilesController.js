const asyncHandler = require('express-async-handler');
const {getModel} = require('ottoman');
const User = getModel('User');


const getProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const loggedin = req.loggedin;

    
    var user;
    try {
        user = await User.findOne({ username });
    } catch (e) {
        console.log(e);
    }
    if (!user) {
        return res.status(404).json({
            message: "User Not Found"
        })
    }
    if (!loggedin) {
        return res.status(200).json({
            profile: user.toProfileJSON(false)
        });
    } else {
        var loginUser;
        try {
            loginUser = await User.findOne({ email: req.userEmail });
        } catch (e) {
            console.log(e);
        }
        if (!loginUser) {
            return res.status(404).json({
                message: "User Not Found"
            })
        }
        return res.status(200).json({
            profile: user.toProfileJSON(loginUser)
        })
    }

});

const followUser = asyncHandler(async (req, res) => {
    const { username } = req.params;
    var loginUser, user;
    try {
        loginUser = await User.findOne({ email: req.userEmail });
        user = await User.findOne({ username });
    } catch (e) {
        console.log(e);
    }
    if (!user || !loginUser) {
        return res.status(404).json({
            message: "User Not Found"
        })
    }
    if (user.email == loginUser.email) {
        return res.status(403).json(
            { errors: {
                 forbidden: [ 'You cannot follow yourself' ] }     
            }
        )
    }
    await loginUser.follow(user.id);

    return res.status(200).json({
        profile: user.toProfileJSON(loginUser)
    })

});

const unFollowUser = asyncHandler(async (req, res) => {
    const { username } = req.params;
    var loginUser, user;
    try {
        loginUser = await User.findOne({ email: req.userEmail });
        user = await User.findOne({ username });
    } catch (e) {
        console.log(e);
    }
    if (!user || !loginUser) {
        return res.status(404).json({
            message: "User Not Found"
        })
    }
    await loginUser.unfollow(user.id);

    return res.status(200).json({
        profile: user.toProfileJSON(loginUser)
    })

});

module.exports = {
    getProfile,
    followUser,
    unFollowUser
}
