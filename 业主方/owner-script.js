// 业主方治理驾驶舱 - 数据驱动逻辑

let globalData = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            globalData = data;
            initOwnerDashboard(data);
        })
        .catch(err => {
            console.error("加载数据失败:", err);
            // 使用模拟数据
            initOwnerDashboard(getMockData());
        });
});

// 主初始化函数
function initOwnerDashboard(data) {
    console.log('初始化业主方驾驶舱', data);
    
    // 1. 顶部决策条
    renderDecisionBar(data);
    
    // 2. 异常画像
    renderInsightPanel(data);
    
    // 3. 四大治理维度
    renderGovernanceDimensions(data);
    
    // 4. 阶段与里程碑
    renderStageTimeline(data);
    renderMilestones(data);
}

// ============================================
// 1. 顶部决策条
// ============================================
function renderDecisionBar(data) {
    // 项目基本信息
    document.getElementById('projectName').innerText = data.project_name;
    document.getElementById('projectCode').innerText = data.project_code;
    
    // 当前阶段
    const currentStage = data.stages[data.current_stage_index];
    document.getElementById('currentStage').innerText = currentStage.name;
    
    // 时间轴信息
    if (data.project_timeline) {
        const timeline = data.project_timeline;
        const progress = Math.round((timeline.elapsed_days / timeline.total_days) * 100);
        document.getElementById('timelineInfo').innerText = 
            `已执行 ${timeline.elapsed_days}/${timeline.total_days} 天 (${progress}%)`;
    }
    
    // 状态灯
    const statusLight = document.getElementById('statusLight');
    const statusLabel = document.getElementById('statusLabel');
    
    if (data.health_status === 'red') {
        statusLight.className = 'status-light';
        statusLabel.innerText = '红色预警';
    } else if (data.health_status === 'yellow') {
        statusLight.className = 'status-light yellow';
        statusLabel.innerText = '黄色预警';
    } else {
        statusLight.className = 'status-light green';
        statusLabel.innerText = '绿色正常';
    }
    
    // 健康指数
    document.getElementById('healthScore').innerText = data.health_score;
    renderHealthGauge(data.health_score);
    
    // 是否建议介入
    const interventionBox = document.getElementById('interventionBox');
    const interventionAnswer = document.getElementById('interventionAnswer');
    
    if (data.supervision && data.supervision.need_intervention) {
        interventionBox.className = 'intervention-box';
        interventionAnswer.innerText = '是';
    } else {
        interventionBox.className = 'intervention-box no';
        interventionAnswer.innerText = '否';
        interventionBox.querySelector('.intervention-icon i').className = 'fas fa-check-circle';
    }
    
    // 红色预警数量
    const redAlertCount = calculateRedAlerts(data);
    document.getElementById('redAlertCount').innerText = redAlertCount;
}

// 计算红色预警数量
function calculateRedAlerts(data) {
    let count = 0;
    
    // 高风险数量
    if (data.risk.high >= 2) count++;
    
    // 健康分数低于60
    if (data.health_score < 60) count++;
    
    // 督办未闭环
    if (data.supervision && data.supervision.pending_count > 0) count++;
    
    return count;
}

// 渲染健康指数仪表盘
function renderHealthGauge(score) {
    const chart = echarts.init(document.getElementById('healthGaugeTop'));
    const color = score < 60 ? '#F53F3F' : (score < 80 ? '#FF7D00' : '#00B42A');
    
    chart.setOption({
        series: [{
            type: 'gauge',
            startAngle: 90,
            endAngle: -270,
            pointer: { show: false },
            progress: { 
                show: true, 
                overlap: false, 
                roundCap: true, 
                itemStyle: { color: color }, 
                width: 8
            },
            axisLine: { 
                lineStyle: { 
                    width: 8,
                    color: [[1, '#E5E6EB']] 
                } 
            },
            splitLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            detail: { show: false },
            data: [{ value: score }]
        }]
    });
    
    window.addEventListener('resize', () => chart.resize());
}

// ============================================
// 2. 异常画像与介入依据
// ============================================
function renderInsightPanel(data) {
    // 自动异常总结
    const summary = generateAutoSummary(data);
    document.getElementById('autoSummary').innerText = summary;
    
    // 最近关键异常
    const exceptions = generateRecentExceptions(data);
    const exceptionList = document.getElementById('recentExceptions');
    exceptionList.innerHTML = exceptions.map(ex => `
        <li class="exception-item ${ex.type}">
            <span class="exception-tag">${ex.tag}</span>
            <span class="exception-desc">${ex.desc}</span>
            <span class="exception-date">${ex.date}</span>
        </li>
    `).join('');
    
    // 最近领导督办
    if (data.supervision && data.supervision.last_comment) {
        const supervisionList = document.getElementById('recentSupervision');
        supervisionList.innerHTML = `
            <li class="supervision-item">
                <div class="supervision-header">
                    <span class="supervisor">${data.supervision.last_comment_by}</span>
                    <span class="supervision-date">${data.supervision.last_comment_date}</span>
                </div>
                <div class="supervision-content">
                    ${data.supervision.last_comment}
                </div>
                <div class="supervision-status ${data.supervision.pending_count > 0 ? 'pending' : 'closed'}">
                    <i class="fas ${data.supervision.pending_count > 0 ? 'fa-clock' : 'fa-check-circle'}"></i> 
                    ${data.supervision.pending_count > 0 ? '待闭环' : '已闭环'}
                </div>
            </li>
        `;
    }
}

// 生成自动异常总结
function generateAutoSummary(data) {
    let issues = [];
    
    // 检查延期
    const delayedMilestone = data.milestones.find(m => m.status === 'delay');
    if (delayedMilestone) {
        issues.push(`${delayedMilestone.name}延期${delayedMilestone.delay_days}天`);
    }
    
    // 检查高风险
    if (data.risk.high > 0) {
        issues.push(`存在${data.risk.high}项高风险未关闭`);
    }
    
    // 检查督办
    if (data.supervision && data.supervision.pending_count > 0) {
        issues.push(`${data.supervision.pending_count}项督办事项未闭环`);
    }
    
    if (issues.length === 0) {
        return '项目整体运行平稳,各项指标正常。';
    }
    
    const issueText = issues.join(' + ');
    const status = data.health_score < 60 ? '红色' : '黄色';
    const action = data.health_score < 60 ? '建议领导重点关注' : '建议持续关注';
    
    return `因【${issueText}】,项目处于${status}状态,${action}。`;
}

// 生成最近关键异常
function generateRecentExceptions(data) {
    const exceptions = [];
    
    // 从里程碑找延期
    const delayedMilestone = data.milestones.find(m => m.status === 'delay');
    if (delayedMilestone) {
        exceptions.push({
            type: 'risk',
            tag: '风险',
            desc: `${delayedMilestone.name}延期${delayedMilestone.delay_days}天(未关闭)`,
            date: '2026-01-29'
        });
    }
    
    // 进度问题
    if (data.progress.gap < -10) {
        exceptions.push({
            type: 'quality',
            tag: '质量',
            desc: '核心功能开发进度滞后',
            date: '2026-01-28'
        });
    }
    
    // 督办问题
    if (data.supervision && data.supervision.pending_count > 0) {
        exceptions.push({
            type: 'accountability',
            tag: '责任',
            desc: '督办事项超期未闭环',
            date: data.supervision.last_comment_date
        });
    }
    
    return exceptions.slice(0, 3);
}

// ============================================
// 3. 四大治理维度
// ============================================
function renderGovernanceDimensions(data) {
    // 1. 风险与安全
    document.getElementById('highRiskCount').innerText = data.risk.high;
    document.getElementById('redWarningCount').innerText = calculateRedAlerts(data);
    document.getElementById('overdueRiskCount').innerText = data.risk.high > 0 ? 1 : 0;
    
    const riskStatus = data.risk.high >= 2 ? 'critical' : (data.risk.high > 0 ? 'warning' : 'normal');
    document.getElementById('riskStatus').className = `status-badge ${riskStatus}`;
    document.getElementById('riskStatus').innerText = riskStatus === 'critical' ? '高危' : (riskStatus === 'warning' ? '预警' : '正常');
    
    renderRiskTrendChart(data);
    
    // 2. 交付质量
    const acceptanceRate = 78; // 模拟数据
    const avgRectification = 2.6;
    const majorQualityIssues = data.issues.major;
    
    document.getElementById('acceptanceRate').innerText = acceptanceRate + '%';
    document.getElementById('avgRectification').innerText = avgRectification;
    document.getElementById('majorQualityIssues').innerText = majorQualityIssues;
    
    const qualityStatus = acceptanceRate < 80 ? 'warning' : 'normal';
    document.getElementById('qualityStatus').className = `status-badge ${qualityStatus}`;
    document.getElementById('qualityStatus').innerText = qualityStatus === 'warning' ? '预警' : '正常';
    
    renderQualityTrendChart(data);
    
    // 3. 责任与闭环
    const openSupervision = data.supervision ? data.supervision.pending_count : 0;
    const overdueTasks = 4; // 模拟数据
    
    document.getElementById('openSupervision').innerText = openSupervision;
    document.getElementById('overdueTasks').innerText = overdueTasks;
    
    // 责任人信息
    if (data.team) {
        document.getElementById('ownerRep').innerText = data.team.leader || '--';
        document.getElementById('projectMgr').innerText = data.team.manager || '--';
        document.getElementById('contractor').innerText = data.team.contractor || '--';
    }
    
    const accountabilityStatus = openSupervision > 0 ? 'warning' : 'normal';
    document.getElementById('accountabilityStatus').className = `status-badge ${accountabilityStatus}`;
    document.getElementById('accountabilityStatus').innerText = accountabilityStatus === 'warning' ? '预警' : '正常';
    
    // 4. 合规与治理
    document.getElementById('stageDocRate').innerText = '85%';
    document.getElementById('acceptanceDocRate').innerText = '78%';
    document.getElementById('approvalTraceRate').innerText = '90%';
    document.getElementById('auditIssueCount').innerText = '2';
}

// 风险趋势图
function renderRiskTrendChart(data) {
    const chart = echarts.init(document.getElementById('riskTrendChart'));
    
    chart.setOption({
        grid: { top: 10, bottom: 10, left: 30, right: 10 },
        xAxis: {
            type: 'category',
            data: ['W1', 'W2', 'W3', 'W4'],
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 10, color: '#86909C' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#E5E6EB' } },
            axisLabel: { fontSize: 10, color: '#86909C' }
        },
        series: [{
            data: [3, 5, 6, data.risk.total],
            type: 'line',
            smooth: true,
            itemStyle: { color: '#F53F3F' },
            lineStyle: { width: 3 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(245, 63, 63, 0.3)' },
                    { offset: 1, color: 'rgba(245, 63, 63, 0.05)' }
                ])
            }
        }]
    });
    
    window.addEventListener('resize', () => chart.resize());
}

// 质量趋势图
function renderQualityTrendChart(data) {
    const chart = echarts.init(document.getElementById('qualityTrendChart'));
    
    chart.setOption({
        grid: { top: 10, bottom: 10, left: 30, right: 10 },
        xAxis: {
            type: 'category',
            data: ['W1', 'W2', 'W3', 'W4'],
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 10, color: '#86909C' }
        },
        yAxis: {
            type: 'value',
            max: 100,
            splitLine: { lineStyle: { type: 'dashed', color: '#E5E6EB' } },
            axisLabel: { fontSize: 10, color: '#86909C', formatter: '{value}%' }
        },
        series: [{
            data: [95, 88, 82, 78],
            type: 'line',
            smooth: true,
            itemStyle: { color: '#FF7D00' },
            lineStyle: { width: 3 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(255, 125, 0, 0.3)' },
                    { offset: 1, color: 'rgba(255, 125, 0, 0.05)' }
                ])
            }
        }]
    });
    
    window.addEventListener('resize', () => chart.resize());
}

// ============================================
// 4. 阶段与里程碑
// ============================================
function renderStageTimeline(data) {
    const container = document.getElementById('stageTimeline');
    if (!container) return;
    
    let html = '';
    
    data.stages.forEach((stage, idx) => {
        let nodeClass = '';
        let iconHtml = idx + 1;
        let statusText = '待开始';
        
        if (stage.status === 'completed') {
            nodeClass = 'completed';
            iconHtml = '<i class="fas fa-check"></i>';
            statusText = '已完成';
        } else if (stage.status === 'current') {
            nodeClass = 'current';
            iconHtml = '<i class="fas fa-play" style="font-size:12px;"></i>';
            statusText = '进行中';
        }
        
        html += `
            <div class="stage-node ${nodeClass}">
                <div class="stage-icon">${iconHtml}</div>
                <div class="stage-name">${stage.name}</div>
                <div class="stage-status">${statusText}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderMilestones(data) {
    const container = document.getElementById('milestoneGrid');
    if (!container) return;
    
    let html = '';
    
    data.milestones.forEach(milestone => {
        let badgeClass = 'pending';
        let badgeText = '待开始';
        let cardClass = '';
        
        if (milestone.status === 'completed') {
            badgeClass = 'completed';
            badgeText = '已完成';
            cardClass = 'completed';
        } else if (milestone.status === 'delay') {
            badgeClass = 'delay';
            badgeText = `延期${milestone.delay_days}天`;
            cardClass = 'delay';
        }
        
        html += `
            <div class="milestone-card ${cardClass}">
                <div class="milestone-info">
                    <div class="milestone-name">${milestone.name}</div>
                    <div class="milestone-date">计划: ${milestone.plan_date}</div>
                </div>
                <span class="milestone-badge ${badgeClass}">${badgeText}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// 交互功能
// ============================================
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId);
    const toggleBtn = document.getElementById(sectionId.replace('Detail', 'Toggle'));
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.style.maxHeight = '600px';
        toggleBtn.classList.add('open');
    } else {
        content.classList.add('collapsed');
        content.style.maxHeight = '0';
        toggleBtn.classList.remove('open');
    }
}

// ============================================
// 模拟数据 (备用)
// ============================================
function getMockData() {
    return {
        project_name: "新疆自治区一体化在线政务服务平台",
        project_code: "GOV-2026-001",
        project_timeline: {
            start_date: "2025-11-01",
            plan_end_date: "2026-03-31",
            total_days: 151,
            elapsed_days: 90
        },
        current_stage_index: 2,
        health_score: 58,
        health_status: "red",
        supervision: {
            need_intervention: true,
            pending_count: 2,
            last_comment: "请加快核心功能开发进度,确保按期完成中期汇报",
            last_comment_date: "2026-01-25",
            last_comment_by: "李副区长"
        },
        team: {
            leader: "王局长",
            manager: "张三",
            contractor: "新疆数字政务建设集团"
        },
        stages: [
            {
                name: "立项与决策",
                status: "completed"
            },
            {
                name: "启动与规划",
                status: "completed"
            },
            {
                name: "执行与控制",
                status: "current"
            },
            {
                name: "收尾与验收",
                status: "pending"
            },
            {
                name: "后评估",
                status: "pending"
            }
        ],
        milestones: [
            {
                name: "需求确认里程碑",
                plan_date: "2025-12-15",
                status: "completed",
                delay_days: 5
            },
            {
                name: "中期阶段汇报",
                plan_date: "2026-01-25",
                status: "delay",
                delay_days: 4
            },
            {
                name: "用户测试(UAT)",
                plan_date: "2026-02-10",
                status: "pending",
                delay_days: 0
            },
            {
                name: "竣工验收",
                plan_date: "2026-03-01",
                status: "pending",
                delay_days: 0
            }
        ],
        risk: {
            high: 2,
            medium: 4,
            low: 6,
            total: 12
        },
        progress: {
            plan: 85,
            actual: 60,
            gap: -25
        },
        issues: {
            open: 5,
            major: 2
        }
    };
}
