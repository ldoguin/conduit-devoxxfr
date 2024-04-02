const asyncHandler = require('express-async-handler');
const {getModel} = require('ottoman');
const User = getModel('User');
const Article = getModel('Article');
const Comment = getModel('Comment');

const addCommentsToArticle = asyncHandler(async (req, res) => {
    const id = req.userId;

    var commenter;
    try {
        commenter = await User.findById(id);
    } catch (e) {
        console.log(e);
    }

    if (!commenter) {
        return res.status(401).json({
            message: "User Not Found"
        });
    }
    const { slug } = req.params;

    var article;
    try {
        article = await Article.findOne({slug});
    } catch (e){
        console.log(e);
    }

    if (!article) {
        return res.status(401).json({
            message: "Article Not Found"
        });
    }

    const { body } = req.body.comment;

    const newComment = await Comment.create({
        body: body,
        author: commenter.id,
        article: article.id
    });

    await article.addComment(newComment.id);

    return res.status(200).json({
        comment: await newComment.toCommentResponse(commenter)
    })

});

const getCommentsFromArticle = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    var article;
    try {
        article = await Article.findOne({slug});
    } catch (e){
        console.log(e);
    }

    if (!article) {
        return res.status(404).json({
            message: "Article Not Found"
        });
    }

    const loggedin = req.loggedin;

    if (!article.comments) return res.status(200).json({comments: []});

    if (loggedin) {
        const loginUser = await User.findById(req.userId);
        return await res.status(200).json({
            comments: await Promise.all(article.comments.map(async commentId => {
                const commentObj = await Comment.findById(commentId);
                return await commentObj.toCommentResponse(loginUser);
            }))
        })
    } else {
        return await res.status(200).json({
            comments: await Promise.all(article.comments.map(async (commentId) => {
                const commentObj = await Comment.findById(commentId);
                // console.log(commentObj);
                const temp =  await commentObj.toCommentResponse(false);
                // console.log(temp);
                return temp;
            }))
        })
    }
});

const deleteComment = asyncHandler(async (req, res) => {
    const userId = req.userId;

    var commenter;
    try {
        commenter = await User.findById(userId);
    } catch (e) {
        console.log(e);
    }

    if (!commenter) {
        return res.status(401).json({
            message: "User Not Found"
        });
    }
    const { slug, id } = req.params;

    var article;
    try {
        article = await Article.findOne({slug});
    } catch (e){
        console.log(e);
    }
    if (!article) {
        return res.status(401).json({
            message: "Article Not Found"
        });
    }

    var comment; 
    try {
        comment = await Comment.findById(id);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            error: "Comment does not exist"
        })
    }

    // console.log(`comment author id: ${comment.author}`);
    // console.log(`commenter id: ${commenter.id}`)

    if (comment.author.toString() === commenter.id.toString()) {
        // potential transaction use case
        await article.removeComment(comment.id);
        await Comment.removeById(comment.id);
        return res.status(200).json({
            message: "comment has been successfully deleted!!!"
        });
    } else {
        return res.status(403).json({
            error: "only the author of the comment can delete the comment"
        })
    }
});

module.exports = {
    addCommentsToArticle,
    getCommentsFromArticle,
    deleteComment
}
