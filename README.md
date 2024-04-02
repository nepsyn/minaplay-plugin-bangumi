[![MinaPlay Logo](https://github.com/nepsyn/minaplay/blob/master/assets/minaplay.png)](https://github.com/nepsyn/minaplay)

# minaplay-plugin-bangumi

[MinaPlay](https://github.com/nepsyn/minaplay) 的 Bangumi.tv 插件支持，可以在 MinaPlay 中添加 Bangumi.tv 中的番剧。

## 安装

### 插件管理器安装

使用 MinaPlay 插件管理器安装，在启用 `plugin-manager` 插件的情况下，在控制台输入：

```shell
pm i bangumi
```

### 本地安装

```shell
# 进入 MinaPlay 插件数据目录
cd minaplay-app-data/plugin
# 克隆仓库到本地
git clone https://github.com/nepsyn/minaplay-plugin-bangumi
cd minaplay-plugin-bangumi
npm install
# 重启 MinaPlay 应用程序应用插件
docker restart minaplay
```

## 使用

### 帮助信息

通过命令打印使用时的帮助信息。

```shell
bgm --help
```

### 添加番剧信息

通过命令添加 Bangumi.tv 上的剧集信息，其中参数为剧集的 ID 。

```shell
bgm add 400602
```

### 查看番剧周表

通过命令在插件控制台中查看 Bangumi.tv 的更新周表，会在打印剧集名称同时打印剧集 ID 。

```shell
# 当日周表
bgm calendar
# 整周周表
bgm calendar -a
```

### 搜索番剧

通过命令搜索 Bangumi.tv 上的番剧信息。

```shell
bgm search 葬送的芙莉莲
```
