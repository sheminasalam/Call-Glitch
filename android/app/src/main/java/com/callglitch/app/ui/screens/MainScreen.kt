package com.callglitch.app.ui.screens

import android.graphics.Bitmap
import androidx.compose.animation.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.callglitch.app.data.AppDiscoveryRepository
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.ImpairmentDirection
import com.callglitch.app.model.InstalledAppInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    isRunning: Boolean,
    activeProfile: GlitchProfileType,
    customConfig: GlitchConfig,
    selectedPackages: Set<String>,
    autoTimeout: Int,
    forwardedPackets: Long,
    droppedPackets: Long,
    appDiscoveryRepository: AppDiscoveryRepository,
    forceOpenAppDialog: Boolean = false,
    onAppDialogDismissed: () -> Unit = {},
    onToggleGlitch: (Boolean) -> Unit,
    onSelectProfile: (GlitchProfileType) -> Unit,
    onUpdateCustomConfig: (GlitchConfig) -> Unit,
    onUpdateSelectedApps: (Set<String>) -> Unit,
    onUpdateTimeout: (Int) -> Unit,
    onRequestAddTile: () -> Unit
) {
    var showAppDialog by remember { mutableStateOf(false) }
    var showAdvanced by remember { mutableStateOf(false) }

    LaunchedEffect(forceOpenAppDialog) {
        if (forceOpenAppDialog) {
            showAppDialog = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Call Glitch",
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                },
                actions = {
                    IconButton(onClick = { showAppDialog = true }) {
                        BadgedBox(
                            badge = {
                                if (selectedPackages.isNotEmpty()) {
                                    Badge { Text("${selectedPackages.size}") }
                                }
                            }
                        ) {
                            Icon(Icons.Default.Apps, contentDescription = "Select Target Apps")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 1. Connection Status Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isRunning) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f)
                    else if (selectedPackages.isEmpty()) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.12f)
                    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isRunning) MaterialTheme.colorScheme.error.copy(alpha = 0.4f)
                    else if (selectedPackages.isEmpty()) MaterialTheme.colorScheme.error.copy(alpha = 0.3f)
                    else MaterialTheme.colorScheme.outlineVariant
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (isRunning) "${activeProfile.displayName} Impairment Active"
                            else if (selectedPackages.isEmpty()) "No Target Apps Selected"
                            else "Normal Network Traffic",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isRunning || selectedPackages.isEmpty()) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (isRunning) "$forwardedPackets forwarded · $droppedPackets dropped"
                            else if (selectedPackages.isEmpty()) "Select at least 1 application below before starting"
                            else "${selectedPackages.size} target apps isolated · VPN Ready",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Box(
                        modifier = Modifier
                            .size(14.dp)
                            .clip(CircleShape)
                            .background(
                                if (isRunning) Color(0xFFEF4444)
                                else if (selectedPackages.isEmpty()) Color(0xFFF59E0B)
                                else Color(0xFF10B981)
                            )
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // 2. Large Tactile ON/OFF Toggle
            Surface(
                onClick = {
                    if (!isRunning && selectedPackages.isEmpty()) {
                        showAppDialog = true
                    } else {
                        onToggleGlitch(!isRunning)
                    }
                },
                shape = CircleShape,
                color = if (isRunning) Color(0xFFEF4444) else MaterialTheme.colorScheme.primary,
                shadowElevation = 8.dp,
                modifier = Modifier.size(140.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = if (isRunning) Icons.Default.PowerSettingsNew else Icons.Default.PlayArrow,
                        contentDescription = "Toggle",
                        tint = Color.White,
                        modifier = Modifier.size(44.dp)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = if (isRunning) "STOP" else "START",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // 3. Profile Selection
            Text(
                "Connection Impairment Profile",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.align(Alignment.Start)
            )
            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                GlitchProfileType.values().forEach { profile ->
                    val isSelected = activeProfile == profile
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onSelectProfile(profile) },
                        shape = RoundedCornerShape(12.dp),
                        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 12.dp, horizontal = 4.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                profile.displayName,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                when (profile) {
                                    GlitchProfileType.MILD -> "280ms / 10%"
                                    GlitchProfileType.MODERATE -> "750ms / 35%"
                                    GlitchProfileType.SEVERE -> "2000ms / 75%"
                                    GlitchProfileType.CUSTOM -> "Custom"
                                },
                                style = MaterialTheme.typography.bodySmall,
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 4. Targeted Applications Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (selectedPackages.isEmpty()) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.15f)
                    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
                ),
                border = if (selectedPackages.isEmpty()) androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.4f)) else null
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Target Applications", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            if (selectedPackages.isEmpty()) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    "(Required)",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            if (selectedPackages.isEmpty()) "Tap Select to choose any installed app (WhatsApp, Chamet, Telegram, Meet, Zoom, etc.)"
                            else "${selectedPackages.size} apps routed via local VPN (all other apps bypass safely)",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (selectedPackages.isEmpty()) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Button(
                        onClick = { showAppDialog = true },
                        colors = if (selectedPackages.isEmpty()) ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error) else ButtonDefaults.buttonColors()
                    ) {
                        Text(if (selectedPackages.isEmpty()) "Select Apps" else "Edit (${selectedPackages.size})")
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 5. Primary In-Call Control: Quick Settings Tile Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Primary In-Call Control: Quick Settings Tile", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text(
                                "Swipe down during a call and tap the Call Glitch tile to toggle without leaving the call.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Button(
                        onClick = onRequestAddTile,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.AddCircleOutline, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add Call Glitch to Quick Settings")
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Auto-Restore Timeout", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text(
                                if (autoTimeout == 0) "No timeout (manual stop only)" else "Stops after $autoTimeout seconds",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            listOf(0 to "Off", 60 to "1m", 180 to "3m", 300 to "5m").forEach { (sec, label) ->
                                FilterChip(
                                    selected = autoTimeout == sec,
                                    onClick = { onUpdateTimeout(sec) },
                                    label = { Text(label, fontSize = 11.sp) }
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 6. Advanced Impairment Settings (Accordion)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                onClick = { showAdvanced = !showAdvanced }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Advanced Impairment Parameters", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Icon(
                        imageVector = if (showAdvanced) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = "Toggle Advanced"
                    )
                }
            }

            AnimatedVisibility(visible = showAdvanced) {
                Column(modifier = Modifier.padding(top = 16.dp)) {
                    Text("Base Latency: ${customConfig.baseLatencyMs} ms", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Slider(
                        value = customConfig.baseLatencyMs.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(baseLatencyMs = it.toInt())) },
                        valueRange = 0f..3000f,
                        steps = 59
                    )

                    Text("Random Jitter: ±${customConfig.randomJitterMs} ms", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Slider(
                        value = customConfig.randomJitterMs.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(randomJitterMs = it.toInt())) },
                        valueRange = 0f..1500f,
                        steps = 59
                    )

                    Text("Packet Loss: ${String.format("%.1f", customConfig.packetLossPercent)} %", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Slider(
                        value = customConfig.packetLossPercent.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(packetLossPercent = it.toDouble())) },
                        valueRange = 0f..95f,
                        steps = 94
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Burst Interruption Controls
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Burst Drop (Temporary Total Cut)", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Text("Drops 100% of media packets intermittently to trigger 'Reconnecting'", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Switch(
                            checked = customConfig.burstInterruptionEnabled,
                            onCheckedChange = { onUpdateCustomConfig(customConfig.copy(burstInterruptionEnabled = it)) }
                        )
                    }

                    if (customConfig.burstInterruptionEnabled) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Cut Duration: ${(customConfig.burstDurationMs / 1000.0)}s every ${customConfig.burstIntervalSeconds}s", fontSize = 12.sp)
                        Slider(
                            value = customConfig.burstDurationMs.toFloat(),
                            onValueChange = { onUpdateCustomConfig(customConfig.copy(burstDurationMs = it.toInt())) },
                            valueRange = 500f..4000f,
                            steps = 34
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text("Traffic Direction: ${customConfig.direction.displayName}", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ImpairmentDirection.values().forEach { dir ->
                            FilterChip(
                                selected = customConfig.direction == dir,
                                onClick = { onUpdateCustomConfig(customConfig.copy(direction = dir)) },
                                label = { Text(dir.displayName, fontSize = 11.sp) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Impair TCP Traffic", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Text("Disabled by default to avoid breaking call signaling/TLS", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Switch(
                            checked = customConfig.affectTcp,
                            onCheckedChange = { onUpdateCustomConfig(customConfig.copy(affectTcp = it)) }
                        )
                    }
                }
            }

            // 7. Dynamic App Selection Full Dialog
            if (showAppDialog) {
                AppSelectionDialog(
                    selectedPackages = selectedPackages,
                    discoveryRepository = appDiscoveryRepository,
                    onDismiss = {
                        showAppDialog = false
                        onAppDialogDismissed()
                    },
                    onConfirm = { updated ->
                        onUpdateSelectedApps(updated)
                        showAppDialog = false
                        onAppDialogDismissed()
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppSelectionDialog(
    selectedPackages: Set<String>,
    discoveryRepository: AppDiscoveryRepository,
    onDismiss: () -> Unit,
    onConfirm: (Set<String>) -> Unit
) {
    var tempSelected by remember { mutableStateOf(selectedPackages) }
    var searchQuery by remember { mutableStateOf("") }
    var includeSystemApps by remember { mutableStateOf(false) }
    var installedApps by remember { mutableStateOf<List<InstalledAppInfo>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(includeSystemApps) {
        isLoading = true
        installedApps = discoveryRepository.getInstalledApps(includeSystemApps)
        isLoading = false
    }

    val filteredApps = remember(installedApps, searchQuery) {
        if (searchQuery.isBlank()) {
            installedApps
        } else {
            val q = searchQuery.trim().lowercase()
            installedApps.filter {
                it.appName.lowercase().contains(q) || it.packageName.lowercase().contains(q)
            }
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 680.dp),
        title = {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Target Applications",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "${tempSelected.size} selected",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Select any installed app to route through Call Glitch. All other apps bypass without impairment.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Search field
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by app name or package...") },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Close, contentDescription = "Clear search")
                            }
                        }
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Action Bar: Select All Filtered / Clear All / System apps toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(
                            onClick = {
                                val currentFilteredPkgs = filteredApps.map { it.packageName }.toSet()
                                tempSelected = tempSelected + currentFilteredPkgs
                            },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("Select All", fontSize = 12.sp)
                        }
                        TextButton(
                            onClick = { tempSelected = emptySet() },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("Clear All", fontSize = 12.sp)
                        }
                    }

                    FilterChip(
                        selected = includeSystemApps,
                        onClick = { includeSystemApps = !includeSystemApps },
                        label = { Text("System Apps", fontSize = 11.sp) }
                    )
                }

                // Quick-action helper for detected calling & conferencing applications
                val detectedCallingApps = remember(installedApps) {
                    val keywords = listOf(
                        "whatsapp", "telegram", "tachyon", "zoom", "meet", "instagram",
                        "orca", "discord", "chamet", "skype", "viber", "call", "wechat"
                    )
                    installedApps.filter { app ->
                        keywords.any { kw ->
                            app.packageName.lowercase().contains(kw) || app.appName.lowercase().contains(kw)
                        }
                    }
                }

                if (detectedCallingApps.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                tempSelected = tempSelected + detectedCallingApps.map { it.packageName }
                            },
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.Call,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    "Quick-Select Detected Calling Apps (${detectedCallingApps.size})",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                            Text(
                                "+ Add All",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                // App list
                if (isLoading) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(36.dp))
                    }
                } else if (filteredApps.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.SearchOff,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(40.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "No applications matched \"$searchQuery\"",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 360.dp)
                    ) {
                        items(filteredApps, key = { it.packageName }) { app ->
                            val isChecked = tempSelected.contains(app.packageName)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        tempSelected = if (isChecked) tempSelected - app.packageName else tempSelected + app.packageName
                                    }
                                    .padding(vertical = 6.dp, horizontal = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = isChecked,
                                    onCheckedChange = { checked ->
                                        tempSelected = if (checked) tempSelected + app.packageName else tempSelected - app.packageName
                                    }
                                )

                                Spacer(modifier = Modifier.width(8.dp))

                                AppIconItem(
                                    packageName = app.packageName,
                                    repository = discoveryRepository
                                )

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = app.appName,
                                            fontWeight = FontWeight.Medium,
                                            fontSize = 14.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        if (app.isSystemApp) {
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Surface(
                                                shape = RoundedCornerShape(4.dp),
                                                color = MaterialTheme.colorScheme.surfaceVariant
                                            ) {
                                                Text(
                                                    "System",
                                                    fontSize = 9.sp,
                                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp),
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }
                                    Text(
                                        text = app.packageName,
                                        style = MaterialTheme.typography.bodySmall,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(tempSelected) },
                enabled = true
            ) {
                Text("Save (${tempSelected.size})")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun AppIconItem(
    packageName: String,
    repository: AppDiscoveryRepository,
    modifier: Modifier = Modifier
) {
    val bitmapState = produceState<Bitmap?>(initialValue = null, key1 = packageName) {
        value = withContext(Dispatchers.IO) {
            repository.loadAppIcon(packageName)
        }
    }
    val bmp = bitmapState.value

    if (bmp != null) {
        Image(
            bitmap = bmp.asImageBitmap(),
            contentDescription = null,
            modifier = modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
        )
    } else {
        Box(
            modifier = modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Android,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
