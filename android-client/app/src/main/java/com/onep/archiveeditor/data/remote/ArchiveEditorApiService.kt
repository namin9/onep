package com.onep.archiveeditor.data.remote

import com.onep.archiveeditor.data.model.LoginResponse
import com.onep.archiveeditor.App
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

// --- API Service Interface ---
interface ArchiveEditorApiService {

    @POST("api/user/login")
    suspend fun login(@Body loginRequest: LoginRequest): LoginResponse
    
    @POST("api/game/progress")
    suspend fun progress(@Body gameProgressRequest: GameProgressRequest): GameProgressResponse

    @POST("api/user/upgrade_stat")
    suspend fun upgradeStat(@Body upgradeStatRequest: UpgradeStatRequest): UpgradeStatResponse

    @POST("api/gacha/pull")
    suspend fun gachaPull(@Body gachaPullRequest: GachaPullRequest): GachaPullResponse

// --- Request Models (for API calls) ---
data class LoginRequest(
    @SerializedName("server_auth_code") val serverAuthCode: String,
    @SerializedName("client_version") val clientVersion: String
)

// --- Retrofit Service Builder ---
object ServiceBuilder {
    private const val BASE_URL = "https://onep.koolee1372-73d.workers.dev/" // Deployed Cloudflare Worker URL

    private val authInterceptor = object : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val originalRequest = chain.request()
            val builder = originalRequest.newBuilder()

            App.jwtToken?.let { token ->
                builder.header("Authorization", "Bearer $token")
            }

            return chain.proceed(builder.build())
        }
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .client(okHttpClient)
        .build()

    val apiService: ArchiveEditorApiService = retrofit.create(ArchiveEditorApiService::class.java)
}