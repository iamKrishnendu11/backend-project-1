import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from "../models/user.models.js";
import {uploadonCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";


// repeated code for user registration

const registerUser = asyncHandler(async(req, res, ) =>{
    
// get user detais from frontend
// validation - empty not
// check if user already exists- username,email
// upload avatar,coverImage , check for avatar
// upload them to cloudnary
// check if it correctly uploaded or not
// create user object - create entry in db
// check if entered in databse or not
// remove password and refersh token field from response
// check for user creation
// return response




//1)get user detais from frontend
       const{fullname, email, username,password} = req.body

       console.log('fullname',fullname);


       // 2) validation - empty not
       if(fullname ===""){
        throw new ApiError(400, "full name is required")
       }

       if(email ===""){
        throw new ApiError(400, "email is required")
       }

       if(username ===""){
        throw new ApiError(400, "username is required")
       }

       if(password ===""){
        throw new ApiError(400, "password is required")
       }

// 3) check if user already exists or not

      const existedUser = await User.findOne({
            $or: [{ username },{ email}]
        })

        if(existedUser) {
            throw new ApiError(409, "User with username or email is already exists")
        }

// 4) upload avatar,coverImage , check for avatar

          const avatarLocalPath =  req.files?.avatar[0]?.path;
         // const coverImageLocalPath =  req.files?.coverImage[0]?.path;
         // not working


            //correct way
         let coverImageLocalPath;
         if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
                coverImageLocalPath =  req.files.coverImage[0].path;

         }

          if(!avatarLocalPath) {
            throw new ApiError(400, "Avatar is needed")
          }

//5)upload them to cloudnary

      const avatar =  await uploadonCloudinary(avatarLocalPath)
      const coverImage =  await uploadonCloudinary(coverImageLocalPath)   

//6)check if it correctly uploaded or not

            if(!avatar) {
                throw new ApiError(500, "Avatar upload failed")
            }
            
//7) create user object - create entry in db
             const user =  await User.create({
                    fullname,
                    avatar:avatar.url,
                    coverImage:coverImage?.url || "" , // as coverImage is not mandetory
                    email,
                    password,
                    username: username.toLowerCase()
                })

//8) check if entered in databse or not

                    const createdUser = await User.findById(user._id).select(
                        "-password -refreshToken"
                        //9) remove password and refersh token field from response
                    )

//10) check for user creation

                    if(!createdUser){
                        throw new ApiError(500,"something went wrong while registering the user")
                    }

 //11) return response

                    return res.status(201).json(
                            new ApiResponse(200,createdUser, "user registered successfully")
                    )

})



const loginUser = asyncHandler(async (req, res) =>{

    // bring data from req. body
    //username or email
    // find the user
    // password check
    // access and refresh token
    //send secure cookies
    // response : succesfully loggedin


    //1) bring data
    const {email, username,password} = await req.body

    console.log(email)
    
    //2) username or email
    if(!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    const ispasswordValid = await user.isPasswordCorrect(password)

    if(!ispasswordValid) {
        throw new ApiError(401, "Invalid password")
    }

    // method calling for tokens
               const {accessToken,refreshToken} = await tokens(user._id)

               const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
                 


    //4) send secure cookies

                const options = {
                    httpOnly : true,
                    secure : true
                }
                return res
                .status(200)
                .cookie("accessToken", accessToken,options)
                .cookie("refreshToken", refreshToken,options)
                .json(            //5) response : successfully logged in
                    new ApiResponse(
                        200,
                        {
                            user: loggedInUser,accessToken,refreshToken
                        },
                        "user logged in sucessfully"
                    )
                )


})

// 3) access and refresh token
const tokens = async(userId) => {
    try {
       const user =  await User.findById(userId)
       const accessToken= user.generateAccsessToken()
       const refreshToken = user.generateRefreshToken()
                // save refresh token in database
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong")
    }
}


const logoutUser = asyncHandler(async(req,res) =>{
        // delete refresh token
      await  User.findByIdAndUpdate(req.user._id,
            {
                $set: {
                    refreshToken : undefined
                },
            },
                {
                    new :true
                }
            )

                // clear cookies
                    const options = {
                        httpOnly :true,
                        secure : true,
                    }

                    return res.status(200)
                    .clearCookie("accessToken", options)
                    .clearCookie("refreshToken", options)
                    .json(new ApiResponse(200, {}, "User logged out"))

            })



const refershAccessToken = asyncHandler(async(req, res) =>
                     {
                  const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
                  if(!incomingRefreshToken) {
                    throw new ApiError(401, "refresh token is required")
                  }
                  try {
                    const decodedToken =jwt.verify(incomingRefreshToken, 
                                          process.env.REFRESH_TOKEN_SECRET)
  
                     const user =await User.findById(decodedToken?._id)
                      if(!user){
                          throw new ApiError(401,"invalid refresh token")
                      }
                    if(incomingRefreshToken !== user?.refreshToken) {
                      throw new ApiError(401,"refresh token is expired")
                    }
                    //generate new token if it is expired
  
                    const options ={
                      httpOnly :true,
                      secure:true,
                    }
  
                    const {accessToken, newRefreshToken} = await tokens(user._id)
  
                          return res.status(200)
                          .cookie("accessToken", accessToken,options)
                          .cookie("refreshToken", newRefreshToken,options)
                          .json(
                              new ApiResponse(
                                  200,
                                  {accessToken, refreshToken: newRefreshToken},
                                  "access token refreshed sucessfully"
                              )
                          )
                  } catch (error) {
                        throw new ApiError(401, error?.message || "invalid refresh token")
                  }

                })


const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body

    if(newPassword !== confirmPassword){
        throw new ApiError(400, "New password and confirm password do not match")
    }

    const user = await User.findById(req.user?._id)

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    
    const isOldPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isOldPasswordValid) {
        throw new ApiError(401, "Invalid current password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))


})


const getCurrentUser = asyncHandler(async(req, res) => {

        return res.status(200).json(200, req.user, "current user fetched sucessfully")

})


const updateAccoutDetails = asyncHandler(async(req,res) => {

    const {fullname, email} = req.body

    if(!fullname || !email) {
        throw new ApiError(400, "all fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
           $set: {
            fullname: fullname,
            email: email
           }
        },
        {new: true, }
    ).select("-password")

        res.status(200)
        .json(new ApiResponse(200,user,"account details updated sucessfully"))
})

const updateAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath =  req.file?.path

   if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
   }
    const avatar = await uploadonCloudinary(avatarLocalPath)
    if(!avatar.url) {
          throw new ApiError(500, "Avatar upload failed")

   }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200, user, "avatar updated sucessfully"))
})

const updatecoverImage = asyncHandler(async(req,res)=>{
   const coverImageLocalPath =  req.file?.path

   if(!coverImageLocalPath) {
        throw new ApiError(400, "cover Image is required")
   }
    const coverImage = await uploadonCloudinary(coverImageLocalPath)
    if(!coverImage.url) {
          throw new ApiError(500, "cover Image upload failed")

   }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "cover image updated sucessfully"))
})

export {
    registerUser, 
    loginUser,
    logoutUser,
    refershAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccoutDetails,
    updateAvatar,
    updatecoverImage
}