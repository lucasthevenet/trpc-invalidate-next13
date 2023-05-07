import { getServerSession as $getServerSession } from "next-auth";

import { authOptions } from "./auth-options";

export const getServerSession = () => {
  return $getServerSession(authOptions);
};
