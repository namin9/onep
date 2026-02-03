package com.onep.archiveeditor.data.model

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize

// --- Login Related Models ---

@Parcelize
data class LoginResponse(
    val status: String,
    val jwt: String,
    @SerializedName("user_data") val userData: UserData,
    @SerializedName("game_config") val gameConfig: GameConfig
) : Parcelable

@Parcelize
data class UserData(
    val stats: UserStats
) : Parcelable

@Parcelize
data class UserStats(
    @SerializedName("user_id") val userId: String,
    @SerializedName("attack_level") val attackLevel: Int,
    @SerializedName("attack_speed_level") val attackSpeedLevel: Int,
    @SerializedName("crit_chance_level") val critChanceLevel: Int,
    @SerializedName("crit_damage_level") val critDamageLevel: Int,
    val rubies: Int,
    val ink: Int,
    @SerializedName("highest_stage") val highestStage: Int,
    @SerializedName("last_login_at") val lastLoginAt: String,
    @SerializedName("total_spent") val totalSpent: Float, // Using Float for REAL
    @SerializedName("has_ad_free") val hasAdFree: Int,
    @SerializedName("mileage_points") val mileagePoints: Int,
    @SerializedName("is_banned") val isBanned: Int,
    @SerializedName("s_pity_counter") val sPityCounter: Int,
    @SerializedName("sss_pity_counter") val sssPityCounter: Int,
    @SerializedName("soul_essence") val soulEssence: Int // Newly added
) : Parcelable

// Placeholder for game config. Will expand as needed.
@Parcelize
data class GameConfig(
    @SerializedName("base_config") val baseConfig: BaseConfig? = null,
    @SerializedName("stat_costs") val statCosts: Map<String, StatCostConfig>? = null,
    // Add other config parts as needed
) : Parcelable

@Parcelize
data class BaseConfig(
    @SerializedName("rubies_per_second_per_stage") val rubiesPerSecondPerStage: Float? = null
) : Parcelable

@Parcelize
data class StatCostConfig(
    @SerializedName("base_cost") val baseCost: Int,
    @SerializedName("growth_rate") val growthRate: Float
) : Parcelable

// --- Common API Response Model (for consistency) ---
@Parcelize
data class ApiResponse(
    val status: String,
    val message: String? = null
) : Parcelable

@Parcelize
data class GameProgressResponse(
    val status: String,
    val message: String? = null,
    val rewards: Rewards? = null,
    @SerializedName("updated_stats") val updatedStats: UserStats? = null
) : Parcelable

@Parcelize
data class Rewards(
    @SerializedName("rubies_earned") val rubiesEarned: Int,
    @SerializedName("offline_seconds") val offlineSeconds: Int
) : Parcelable

data class GameProgressRequest(
    @SerializedName("client_highest_stage") val clientHighestStage: Int
)

// --- Upgrade Stat Models ---
@Parcelize
data class UpgradeStatResponse(
    val status: String,
    val message: String? = null,
    @SerializedName("updated_stats") val updatedStats: UserStats? = null
) : Parcelable

data class UpgradeStatRequest(
    @SerializedName("stat_type") val statType: String,
    @SerializedName("upgrade_amount") val upgradeAmount: Int
)

// --- Gacha Models ---
@Parcelize
data class GachaPullResponse(
    val status: String,
    val message: String? = null,
    @SerializedName("obtained_skins") val obtainedSkins: List<ObtainedSkin>? = null,
    @SerializedName("updated_stats") val updatedStats: UserStats? = null
) : Parcelable

@Parcelize
data class ObtainedSkin(
    val id: Int,
    val grade: String,
    val name: String, // Assuming skin name will be returned
    @SerializedName("instance_id") val instanceId: String,
    val options: List<SkinOption> // Assuming options are part of the skin in response
) : Parcelable

@Parcelize
data class SkinOption(
    @SerializedName("option_type") val optionType: String,
    @SerializedName("option_value") val optionValue: Float
) : Parcelable

data class GachaPullRequest(
    @SerializedName("pull_count") val pullCount: Int
)

// --- Library Models ---
@Parcelize
data class LibraryCodexResponse(
    val status: String,
    val message: String? = null,
    val codex: List<MonsterCodexEntry>? = null
) : Parcelable

@Parcelize
data class MonsterCodexEntry(
    @SerializedName("monster_id") val monsterId: Int,
    @SerializedName("monster_name") val monsterName: String,
    val description: String,
    @SerializedName("required_fragments") val requiredFragments: Int,
    @SerializedName("collected_fragments") val collectedFragments: Int,
    @SerializedName("is_completed") val isCompleted: Int, // 0 for false, 1 for true
    // Placeholder for monster sprite URL
    val spriteUrl: String? = null
) : Parcelable

@Parcelize
data class SubmitFragmentsResponse(
    val status: String,
    val message: String? = null,
    @SerializedName("monster_id") val monsterId: Int,
    @SerializedName("fragments_added") val fragmentsAdded: Int,
    @SerializedName("collected_fragments") val collectedFragments: Int,
    @SerializedName("is_completed") val isCompleted: Int // 0 for false, 1 for true
) : Parcelable

data class SubmitFragmentsRequest(
    @SerializedName("monster_id") val monsterId: Int,
    @SerializedName("fragments_to_add") val fragmentsToAdd: Int
)