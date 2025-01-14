import BaseModel from 'Common/Models/BaseModel';
import CompareBase from 'Common/Types/Database/CompareBase';
import InBetween from 'Common/Types/Database/InBetween';
import Search from 'Common/Types/Database/Search';
import { JSONObject, JSONValue } from 'Common/Types/JSON';

type Query<TBaseModel extends BaseModel | JSONObject> = {
    [P in keyof TBaseModel]?: JSONValue | Search | InBetween | CompareBase;
};

export default Query;
