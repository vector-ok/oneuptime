import IncidentRole from "Common/Models/DatabaseModels/IncidentRole";
import React, {
  FunctionComponent,
  ReactElement,
  useEffect,
  useState,
} from "react";
import ObjectID from "Common/Types/ObjectID";
import API from "Common/UI/Utils/API/API";
import ModelAPI from "Common/UI/Utils/ModelAPI/ModelAPI";
import Includes from "Common/Types/BaseDatabase/Includes";
import { LIMIT_PER_PROJECT } from "Common/Types/Database/LimitMax";
import SortOrder from "Common/Types/BaseDatabase/SortOrder";
import ListResult from "Common/Types/BaseDatabase/ListResult";
import { Black } from "Common/Types/BrandColors";
import ErrorMessage from "Common/UI/Components/ErrorMessage/ErrorMessage";
import ComponentLoader from "Common/UI/Components/ComponentLoader/ComponentLoader";
import Pill from "Common/UI/Components/Pill/Pill";
import FetchUsers from "../User/FetchUsers";
import { RoleAssignment } from "../Incident/IncidentRoleFormField";
import { PromiseVoidFunction } from "Common/Types/FunctionTypes";
import Exception from "Common/Types/Exception/Exception";

export interface ComponentProps {
  assignments: Array<RoleAssignment>;
}

/*
 * A create wizard holds only the ids of the roles it assigns and of the users
 * assigned to them, so its review step looks the roles up to show each one's
 * name in its color, with the people assigned to it beneath - instead of a
 * count of users and roles that names neither. Incident and episode roles are
 * both IncidentRole records.
 */
const FetchIncidentRoleAssignments: FunctionComponent<ComponentProps> = (
  props: ComponentProps,
): ReactElement => {
  // One lookup covers every role on screen; a different set asks again.
  const roleIdsKey: string = Array.from(
    new Set(
      props.assignments.map((assignment: RoleAssignment): string => {
        return assignment.roleId;
      }),
    ),
  ).join(",");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [rolesById, setRolesById] = useState<Map<string, IncidentRole>>(
    new Map(),
  );

  useEffect(() => {
    // Only the answer for the roles on screen may land.
    let isCurrent: boolean = true;

    const fetchRoles: PromiseVoidFunction = async (): Promise<void> => {
      setError("");

      if (!roleIdsKey) {
        setRolesById(new Map());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const roles: ListResult<IncidentRole> =
          await ModelAPI.getList<IncidentRole>({
            modelType: IncidentRole,
            query: {
              _id: new Includes(
                roleIdsKey.split(",").map((roleId: string): ObjectID => {
                  return new ObjectID(roleId);
                }),
              ),
            },
            skip: 0,
            limit: LIMIT_PER_PROJECT,
            select: {
              _id: true,
              name: true,
              color: true,
            },
            sort: {
              name: SortOrder.Ascending,
            },
          });

        if (isCurrent) {
          const fetchedRolesById: Map<string, IncidentRole> = new Map();

          for (const role of roles.data) {
            if (role._id) {
              fetchedRolesById.set(role._id.toString(), role);
            }
          }

          setRolesById(fetchedRolesById);
        }
      } catch (err) {
        if (isCurrent) {
          setError(API.getFriendlyMessage(err));
        }
      }

      if (isCurrent) {
        setIsLoading(false);
      }
    };

    fetchRoles().catch((err: Exception) => {
      if (isCurrent) {
        setError(API.getFriendlyMessage(err));
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [roleIdsKey]);

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (isLoading) {
    return <ComponentLoader />;
  }

  return (
    <div className="space-y-4">
      {props.assignments.map((assignment: RoleAssignment) => {
        const role: IncidentRole | undefined = rolesById.get(assignment.roleId);

        return (
          <div key={assignment.roleId}>
            {role ? (
              <Pill
                isMinimal={true}
                color={role.color || Black}
                text={role.name || "Unnamed Role"}
              />
            ) : (
              <p>The selected role could not be found.</p>
            )}
            {/*
             * FetchUsers looks its users up once, when it mounts, so a
             * different set of users for this role mounts a new one.
             */}
            <FetchUsers
              key={assignment.userIds.join(",")}
              userIds={assignment.userIds.map((userId: string): ObjectID => {
                return new ObjectID(userId);
              })}
            />
          </div>
        );
      })}
    </div>
  );
};

export default FetchIncidentRoleAssignments;
