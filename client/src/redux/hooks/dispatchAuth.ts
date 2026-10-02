import { useAppDispatch } from "../hook";
import { connectGmail, deleteResume, fetchCurrentUser, updateProfile } from "../slices/authSlice";

export function dispatchAuth() {
    const dispatch = useAppDispatch();
    return {
       me:()=>dispatch(fetchCurrentUser()).unwrap(),
       updateProfile:(name:string)=>dispatch(updateProfile({name})).unwrap(),
       addFile:(file:File)=>dispatch(updateProfile({resume:file})).unwrap(),
       deleteFile:(id:string)=>dispatch(deleteResume(id)).unwrap(),
       connectGmail:(code:string)=>dispatch(connectGmail(code)).unwrap(),
       fetchCurrentUser:()=>dispatch(fetchCurrentUser()).unwrap()
       
    }
}
