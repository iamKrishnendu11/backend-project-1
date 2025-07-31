import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from "../models/user.models.js";
import {uploadonCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js";



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

export {registerUser}