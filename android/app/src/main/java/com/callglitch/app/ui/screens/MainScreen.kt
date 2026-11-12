package com.callglitch.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.ImpairmentDirection

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
    onToggleGlitch: (Boolean) -> Unit,
    onSelectProfile: (GlitchProfileType) -> Unit,
    onUpdateCustomConfig: (GlitchConfig) -> Unit,
    onUpdateSelectedApps: (Set<String>) -> Unit,
    onUpdateTimeout: (Int) -> Unit,
    onRequestAddTile: () -> Unit
) {
    var showAppDialog by remember { mutableStateOf(false) }
    var showAdvanced by remember { mutableStateOf(false) }

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
                        Icon(Icons.Default.Apps, contentDescription = "Select Calling Apps")
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
                    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isRunning) MaterialTheme.colorScheme.error.copy(alpha = 0.4f)
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
                    Column {
                        Text(
                            text = if (isRunning) "${activeProfile.displayName} Impairment Active" else "Normal Network Traffic",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isRunning) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (isRunning) "$forwardedPackets forwarded · $droppedPackets dropped"
                            else "${selectedPackages.size} calling apps targeted · VPN Ready",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(14.dp)
                            .clip(CircleShape)
                            .background(if (isRunning) Color(0xFFEF4444) else Color(0xFF10B981))
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // 2. Large Tactile ON/OFF Toggle
            Surface(
                onClick = { onToggleGlitch(!isRunning) },
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
                                    GlitchProfileType.MILD -> "120ms / 1%"
                                    GlitchProfileType.MODERATE -> "220ms / 3%"
                                    GlitchProfileType.SEVERE -> "350ms / 7%"
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

            // 4. Targeted Calling Applications
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Targeted Calling Apps", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        Text(
                            "${selectedPackages.size} apps routed through VPN (unselected bypass)",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    TextButton(onClick = { showAppDialog = true }) {
                        Text("Edit")
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
                    // Base Latency Slider
                    Text("Base Latency: ${customConfig.baseLatencyMs} ms", fontSize = 13.sp)
                    Slider(
                        value = customConfig.baseLatencyMs.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(baseLatencyMs = it.toInt())) },
                        valueRange = 0f..800f
                    )

                    // Jitter Slider
                    Text("Random Jitter: ±${customConfig.randomJitterMs} ms", fontSize = 13.sp)
                    Slider(
                        value = customConfig.randomJitterMs.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(randomJitterMs = it.toInt())) },
                        valueRange = 0f..300f
                    )

                    // Packet Loss Slider
                    Text("Packet Loss: ${String.format("%.1f", customConfig.packetLossPercent)} %", fontSize = 13.sp)
                    Slider(
                        value = customConfig.packetLossPercent.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(packetLossPercent = it.toDouble())) },
                        valueRange = 0f..25f
                    )

                    // Impairment Direction
                    Text("Traffic Direction: ${customConfig.direction.displayName}", fontSize = 13.sp)
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

                    // TCP Impairment Switch
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
        }
    }
}
