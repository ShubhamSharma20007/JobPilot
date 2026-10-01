import { useAppDispatch } from "../hook";
import { fetchCurrentUser } from "../slices/authSlice";

export function dispatchAuth() {
    const dispatch = useAppDispatch();
    return {
       me:()=>dispatch(fetchCurrentUser())
    }
}
