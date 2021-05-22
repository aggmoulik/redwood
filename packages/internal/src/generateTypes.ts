import fs from 'fs'
import path from 'path'

import { findCells, findDirectoryNamedModules } from './findFiles'
import { getPaths, processPagesDir } from './paths'

// TODO: We generate some types as part of the transpilation process.
// Those should be removed and placed over here.
export const generateTypes = () => {
  const p1 = generateDirectoryNamedModuleTypeDefs()
  const p2 = generateCellTypesDefs()
  const p3 = generateRouterPageImports()
  const p4 = generateCurrentUserTypeDef()

  return [...p1, ...p2, p3[0], p4[0]]
}

export const generateRouterPageImports = () => {
  const rwjsPaths = getPaths()
  const pages = processPagesDir()

  const defs = pages.map(({ importName, importPath }) => {
    return [
      `import ${importName}Type from '${importPath}'`,
      `const ${importName}: typeof ${importName}Type`,
    ]
  })

  const typeDefContents = `// This file is generated by RedwoodJS
${defs.map((x) => x[0]).join('\n')}

declare global {
  ${defs.map((x) => x[1]).join('\n  ')}
}
`
  const typeDefPath = path.join(rwjsPaths.types, 'web-global-pages.d.ts')
  fs.writeFileSync(typeDefPath, typeDefContents)
  return [typeDefPath]
}

export const generateCurrentUserTypeDef = () => {
  const typeDefContents = `// This file is generated by RedwoodJS
import '@redwoodjs/api'
import '@redwoodjs/auth'

import { getCurrentUser } from '../../api/src/lib/auth'

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
export type InferredCurrentUser = ThenArg<ReturnType<typeof getCurrentUser>>

declare module '@redwoodjs/api' {
  interface GlobalContext {
    currentUser?: InferredCurrentUser
  }
}

declare module '@redwoodjs/auth' {
  interface CurrentUser extends InferredCurrentUser {}
}
`
  const rwjsPaths = getPaths()
  const typeDefPath = path.join(rwjsPaths.types, 'currentUser.d.ts')
  fs.writeFileSync(typeDefPath, typeDefContents)
  return [typeDefPath]
}

export const generateRouterRoutesTypeDef = () => {
  // const rwjsPaths = getPaths()
  // const pages = processPagesDir()
  // We need to parse the router file; we can use structure, but we probably want to do this in `ast`.
  // import '@redwoodjs/router'
  // type ParamType<constraint> = constraint extends "Int" ? number : constraint extends "Boolean" ? boolean : constraint extends "Float" ? number : string;
  // type RouteParams<Route> = Route extends `${string}/{${infer Param}:${infer Constraint}}/${infer Rest}` ? { [Entry in Param]: ParamType<Constraint> } & RouteParams<`/${Rest}`> : Route extends `${string}/{${infer Param}:${infer Constraint}}` ? { [Entry in Param]: ParamType<Constraint> } : Route extends `${string}/{${infer Param}}/${infer Rest}` ? { [Entry in Param]: string } & RouteParams<`/${Rest}`> : {}
  // type QueryParams = Record<string | number, string | number | boolean>
  // declare module '@redwoodjs/router' {
  //   interface AvailableRoutes {
  //     entry: (params?: RouteParams<"/"> & QueryParams) => "/"
  //     accessTokens: (params?: RouteParams<"/access-tokens"> & QueryParams) => "/access-tokens"
  //     accessToken: (params?: RouteParams<"/access-token/{type}"> & QueryParams) => "/access-token/{type}"
  //     organizations: (params?: RouteParams<"/organizations"> & QueryParams) => "/organizations"
  //     pricing: (params?: RouteParams<"/organization/{organizationId}/pricing"> & QueryParams) => "/organization/{organizationId}/pricing"
  //     editOrganization: (params?: RouteParams<"/organization/{organizationId}/edit"> & QueryParams) => "/organization/{organizationId}/edit"
  //     selectDatabase: (params?: RouteParams<"/organization/{organizationId}/database/select"> & QueryParams) => "/organization/{organizationId}/database/select"
  //     database: (params?: RouteParams<"/organization/{organizationId}/database/{databaseId}"> & QueryParams) => "/organization/{organizationId}/database/{databaseId}"
  //     snapshot: (params?: RouteParams<"/organization/{organizationId}/database/{databaseId}/snapshot/{snapshotId}"> & QueryParams) => "/organization/{organizationId}/database/{databaseId}/snapshot/{snapshotId}"
  //     editDatabase: (params?: RouteParams<"/organization/{organizationId}/database/{databaseId}/edit/modifications/{section}"> & QueryParams) => "/organization/{organizationId}/database/{databaseId}/edit/modifications/{section}"
  //     createDatabaseConnection: (params?: RouteParams<"/organization/{organizationId}/database/{databaseId}/setup/connection"> & QueryParams) => "/organization/{organizationId}/database/{databaseId}/setup/connection"
  //     setupDatabase: (params?: RouteParams<"/organization/{organizationId}/database/{databaseId}/setup/modifications/{section}"> & QueryParams) => "/organization/{organizationId}/database/{databaseId}/setup/modifications/{section}"
  //     createOrJoinOrganization: (params?: RouteParams<"/onboarding/create-or-join-team"> & QueryParams) => "/onboarding/create-or-join-team"
  //     onboardingSteps: (params?: RouteParams<"/onboarding/{organizationId}/welcome"> & QueryParams) => "/onboarding/{organizationId}/welcome"
  //     onboardingSetupConnection: (params?: RouteParams<"/onboarding/{organizationId}/database/{databaseId}/setup/connection"> & QueryParams) => "/onboarding/{organizationId}/database/{databaseId}/setup/connection"
  //     onboardingSetupModifications: (params?: RouteParams<"/onboarding/{organizationId}/database/{databaseId}/setup/modifications/{section}"> & QueryParams) => "/onboarding/{organizationId}/database/{databaseId}/setup/modifications/{section}"
  //     onboardingComplete: (params?: RouteParams<"/onboarding/{organizationId}/database/{databaseId}/complete"> & QueryParams) => "/onboarding/{organizationId}/database/{databaseId}/complete"
  //     acceptInvite: (params?: RouteParams<"/accept-invite"> & QueryParams) => "/accept-invite"
  //     logIn: (params?: RouteParams<"/login"> & QueryParams) => "/login"
  //     logOut: (params?: RouteParams<"/logout"> & QueryParams) => "/logout"
  //   }
  // }
}

export const generateDirectoryNamedModuleTypeDefs = () => {
  const rwjsPaths = getPaths()
  const paths = findDirectoryNamedModules()

  return paths.map((p) => {
    const { dir, name } = path.parse(p)

    const mirrorDir = path.join(
      rwjsPaths.mirror,
      dir.replace(rwjsPaths.base, '')
    )
    fs.mkdirSync(mirrorDir, { recursive: true })
    const typeDefPath = path.join(mirrorDir, 'index.d.ts')
    // Note: We're using this wacky identation to create nicely formatted files.
    const typeDefContents = `// This file is generated by RedwoodJS
import { default as DEFAULT } from './${name}'
export default DEFAULT
export * from './${name}'
`
    fs.writeFileSync(typeDefPath, typeDefContents)

    return typeDefPath
  })
}

export const generateCellTypesDefs = () => {
  const rwjsPaths = getPaths()
  const paths = findCells()

  return paths.map((p) => {
    const { dir, name } = path.parse(p)

    const mirrorDir = path.join(
      rwjsPaths.mirror,
      dir.replace(rwjsPaths.base, '')
    )
    fs.mkdirSync(mirrorDir, { recursive: true })

    const typeDefPath = path.join(mirrorDir, 'index.d.ts')
    // Note: We're using this wacky identation to create nicely formatted files.
    const typeDefContents = `// This file is generated by RedwoodJS
import { Success } from './${name}'
type SuccessType = typeof Success
export default function (): ReturnType<SuccessType>
`
    fs.writeFileSync(typeDefPath, typeDefContents)

    return typeDefPath
  })
}
