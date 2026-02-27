const { withProjectBuildGradle } = require('@expo/config-plugins');

const LOCAL_REPO_LINE = 'maven { url("$rootDir/../node_modules/@react-native-async-storage/async-storage/android/local_repo") }';

function addAsyncStorageLocalRepo(contents) {
  if (contents.includes('async-storage/android/local_repo')) {
    return contents;
  }

  const allprojectsIndex = contents.indexOf('allprojects');
  if (allprojectsIndex === -1) {
    return contents;
  }

  const before = contents.slice(0, allprojectsIndex);
  const after = contents.slice(allprojectsIndex);

  // Only patch the allprojects repositories block (buildscript is above it).
  const updatedAfter = after.replace(
    /(^\s*)mavenCentral\(\)\s*$/m,
    (match, indent) => `${indent}mavenCentral()\n${indent}${LOCAL_REPO_LINE}`
  );

  return before + updatedAfter;
}

module.exports = function withAsyncStorageLocalRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    config.modResults.contents = addAsyncStorageLocalRepo(config.modResults.contents);
    return config;
  });
};
