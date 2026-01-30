// =========================================
// 1. Mock Data
// =========================================
const mockOwnerData = {
    "project_name": "新疆自治区一体化在线政务服务平台",
    "project_code": "GOV-2026-001",
    "project_timeline": {
        "start_date": "2025-11-01",
        "plan_end_date": "2026-03-31",
        "total_days": 151,
        "elapsed_days": 90
    },
    "current_stage_index": 2,
    "health_score": 58,
    "health_status": "red",
    "update_time": "2026-01-30 14:30",

    "team": {
        "leader": "王局长", // 新增负责人数据
        "manager": "张三",
        "contractor": "新疆数字政务建设集团"
    },

    "supervision": { "need_intervention": true, "pending_count": 2, "overdue_tasks": 4 },
    "risk": { "high": 2, "audit_issues": 2 },
    "fund": { "total": 1200, "used": 1026, "rate": 85.5 },
    "quality": { "acceptance_rate": 78, "major_issues": 1, "trend": [95, 88, 82, 78] },
    "compliance": { "missing_doc": "中期验收报告" },

    "stages": [
        {
          "name": "立项与决策", "status": "completed",
          "metrics": { "duration": "45天", "docs_count": 8, "approval_rate": "100%", "risk_count": 0 },
          "sub_tasks": [ {"name": "项目建议书申报", "status": "done"}, {"name": "财政资金批复", "status": "done"} ]
        },
        {
          "name": "启动与规划", "status": "completed",
          "metrics": { "duration": "20天", "docs_count": 12, "budget_check": "正常", "risk_count": 1 },
          "sub_tasks": [ {"name": "招投标完成", "status": "done"}, {"name": "合同签订", "status": "done"} ]
        },
        {
          "name": "执行与控制", "status": "current",
          "metrics": { "duration": "已延期", "docs_count": 45, "risk_count": 6, "change_count": 3 },
          "sub_tasks": [
            {"name": "需求分析确认", "status": "done"},
            {"name": "系统架构设计", "status": "done"},
            {"name": "核心功能开发", "status": "delay"},
            {"name": "中期阶段汇报", "status": "pending"},
            {"name": "数据迁移方案", "status": "pending"}
          ]
        },
        {
          "name": "收尾与验收", "status": "pending",
          "metrics": { "duration": "预计30天", "docs_count": 0, "bug_count": 0, "pass_rate": "--" },
          "sub_tasks": [ {"name": "系统上线试运行", "status": "pending"}, {"name": "初步验收会", "status": "pending"} ]
        },
        {
          "name": "后评估", "status": "pending",
          "metrics": { "duration": "预计15天", "satisfaction": "--", "ops_cost": "--" },
          "sub_tasks": [ {"name": "运维团队移交", "status": "pending"}, {"name": "档案归档", "status": "pending"} ]
        }
    ],

    "milestones": [
        { "name": "需求确认", "date": "2025-12-20", "status": "completed" },
        { "name": "中期汇报", "date": "2026-01-25", "status": "delay", "delay_days": 4 },
        { "name": "竣工验收", "date": "2026-03-01", "status": "pending" }
    ]
};

// =========================================
// 2. Initialization
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    initOwnerDashboard(mockOwnerData);
});

function initOwnerDashboard(data) {
    // 头部信息填充 (更新：支持新增字段)
    setText('pName', data.project_name);
    setText('pCode', data.project_code);
    setText('pLeader', data.team.leader);
    setText('pManager', data.team.manager);
    setText('pContractor', data.team.contractor);
    setText('updateTime', data.update_time);
    
    setText('projectPeriod', `${data.project_timeline.start_date} ~ ${data.project_timeline.plan_end_date}`);
    setText('totalDays', data.project_timeline.total_days); // 新增
    setText('elapsedDays', data.project_timeline.elapsed_days); // 新增
    setText('currentStageText', data.stages[data.current_stage_index].name);

    renderKPIs(data);
    renderInsight(data);
    renderLifecycle(data);
    renderGovernanceDetails(data);

    // 默认打开当前阶段详情
    const currentIdx = data.stages.findIndex(s => s.status === 'current');
    if(currentIdx !== -1) showStageDetail(currentIdx);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}

// =========================================
// 3. Render KPIs
// =========================================
function renderKPIs(data) {
    // 1. 健康度 (高级仪表盘)
    const hChart = echarts.init(document.getElementById('healthGauge'));
    hChart.setOption({
        series: [{
            type: 'gauge',
            startAngle: 180, endAngle: 0,
            min: 0, max: 100,
            radius: '110%',
            center: ['50%', '70%'],
            splitNumber: 5,
            itemStyle: { color: data.health_score < 60 ? '#F53F3F' : '#1664FF' },
            progress: { show: true, width: 12, roundCap: true },
            pointer: { show: true, length: '60%', width: 6, itemStyle: { color: 'auto' } },
            axisLine: { lineStyle: { width: 12, color: [[0.3, '#F53F3F'], [0.7, '#FF7D00'], [1, '#1664FF']] } },
            axisTick: { distance: -18, length: 6, lineStyle: { color: '#fff', width: 2 } },
            splitLine: { distance: -18, length: 12, lineStyle: { color: '#fff', width: 3 } },
            axisLabel: { distance: -35, color: '#999', fontSize: 10 },
            detail: { show: false },
            data: [{ value: data.health_score }]
        }]
    });
    setText('healthScoreDisplay', data.health_score);
    
    const tag = document.getElementById('interventionTag');
    if(data.supervision.need_intervention) {
        tag.innerText = '建议立即介入'; tag.style.background = '#FFECE8'; tag.style.color = '#F53F3F';
    } else {
        tag.innerText = '无需介入'; tag.style.background = '#E8FFEA'; tag.style.color = '#00B42A';
    }

    // 2. 资金
    const fChart = echarts.init(document.getElementById('chartFund'));
    fChart.setOption({
        color: ['#1664FF', '#F2F3F5'],
        series: [{ type: 'pie', radius: ['65%', '85%'], center: ['50%', '50%'], label: { show: false }, data: [{ value: data.fund.used }, { value: data.fund.total - data.fund.used }] }]
    });
    setText('totalFund', data.fund.total);
    setText('fundRate', data.fund.rate + '%');

    // 3. 风险
    setText('redAlertCount', data.risk.high);
    setText('highRiskCount', data.risk.high);
    setText('auditCount', data.risk.audit_issues);

    // 4. 责任
    const aChart = echarts.init(document.getElementById('chartAccountability'));
    aChart.setOption({
        color: ['#FF7D00', '#F2F3F5'],
        series: [{ type: 'pie', radius: ['65%', '85%'], center: ['50%', '50%'], label: { show: false }, data: [{ value: data.supervision.pending_count + data.supervision.overdue_tasks }, { value: 10 }] }]
    });
    setText('openSupervision', data.supervision.pending_count);
    setText('overdueTask', data.supervision.overdue_tasks);

    window.addEventListener('resize', () => { hChart.resize(); fChart.resize(); aChart.resize(); });
}

// =========================================
// 4. Insight
// =========================================
function renderInsight(data) {
    const issues = [];
    if(data.health_score < 60) issues.push("健康度低");
    if(data.risk.high > 0) issues.push(`${data.risk.high}项高风险`);
    const text = `项目当前存在 **${issues.join("、")}** 等问题，整体风险较高。建议重点关注 **${data.compliance.missing_doc}** 的缺失情况及中期汇报的延期风险。`;
    document.getElementById('autoSummary').innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<span style="color:#1D2129;font-weight:700">$1</span>');
}

// =========================================
// 5. Lifecycle
// =========================================
function renderLifecycle(data) {
    const container = document.getElementById('lifecycleSteps');
    let html = '';
    
    data.stages.forEach((stage, idx) => {
        let statusClass = '';
        let iconHtml = idx + 1;
        let dateText = '待定';

        if (stage.status === 'completed') {
            statusClass = 'completed';
            iconHtml = '<i class="fas fa-check"></i>';
            dateText = '已完成';
        } else if (stage.status === 'current') {
            statusClass = 'current';
            iconHtml = '<i class="fas fa-play" style="font-size:12px"></i>';
            dateText = '进行中';
        }

        html += `
            <div class="step-node ${statusClass}" onclick="showStageDetail(${idx})">
                <div class="step-icon">${iconHtml}</div>
                <div class="step-name">${stage.name}</div>
                <div class="step-date-tag">${dateText}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function showStageDetail(idx) {
    const stage = mockOwnerData.stages[idx];
    const metricsContainer = document.getElementById('detailMetrics');
    const listContainer = document.getElementById('detailTaskList');
    
    document.querySelectorAll('.step-node').forEach((el, i) => {
        if(i === idx) el.classList.add('current');
        else if(mockOwnerData.stages[i].status !== 'current') el.classList.remove('current');
    });

    // 指标
    const metricsMap = [
        { key: 'duration', label: '阶段工期', icon: 'fa-clock', color: '#1664FF' },
        { key: 'docs_count', label: '产出文档', icon: 'fa-file-alt', color: '#722ED1' },
        { key: 'approval_rate', label: '审批通过率', icon: 'fa-check-double', color: '#00B42A' },
        { key: 'risk_count', label: '关联风险', icon: 'fa-exclamation-triangle', color: '#FF7D00' }
    ];
    metricsContainer.innerHTML = metricsMap.map(cfg => `
        <div class="metric-box">
            <i class="fas ${cfg.icon} m-icon" style="color:${cfg.color}"></i>
            <div class="m-val" style="color:${cfg.color}">${stage.metrics[cfg.key] || '--'}</div>
            <div class="m-lbl">${cfg.label}</div>
        </div>
    `).join('');

    // 清单
    if(stage.sub_tasks && stage.sub_tasks.length) {
        listContainer.innerHTML = stage.sub_tasks.map(t => {
            let badgeClass = 'pending';
            let badgeText = '未开始';
            if(t.status === 'done') { badgeClass = 'done'; badgeText = '已完成'; }
            if(t.status === 'delay') { badgeClass = 'delay'; badgeText = '已延期'; }
            if(t.status === 'pending' && stage.status === 'current') badgeText = '进行中';
            
            return `
                <div class="task-item">
                    <div class="task-left">
                        <i class="fas fa-circle" style="font-size:6px; color:#C9CDD4"></i>
                        <span>${t.name}</span>
                    </div>
                    <span class="status-badge ${badgeClass}">${badgeText}</span>
                </div>
            `;
        }).join('');
    } else {
        listContainer.innerHTML = '<div style="text-align:center;color:#999;padding:20px">暂无数据</div>';
    }

    document.getElementById('stageDetailPanel').style.display = 'block';
}

// =========================================
// 6. Governance Details
// =========================================
function renderGovernanceDetails(data) {
    const qChart = echarts.init(document.getElementById('chartQualityTrend'));
    qChart.setOption({
        grid: { top: 5, bottom: 5, left: 0, right: 0 },
        xAxis: { type: 'category', show: false, data: ['1','2','3','4'] },
        yAxis: { type: 'value', show: false, min: 70 },
        series: [{
            type: 'line', smooth: true, showSymbol: false, data: data.quality.trend,
            lineStyle: { color: '#FF7D00', width: 2 },
            areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0, color:'rgba(255,125,0,0.2)'}, {offset:1, color:'rgba(255,125,0,0)'}]) }
        }]
    });
    setText('acceptanceRate', data.quality.acceptance_rate + '%');
    setText('majorIssues', data.quality.major_issues);
    window.addEventListener('resize', () => qChart.resize());

    const msContainer = document.getElementById('milestoneListMini');
    msContainer.innerHTML = data.milestones.map(m => {
        let dotClass = 'pending';
        if(m.status === 'completed') dotClass = 'done';
        if(m.status === 'delay') dotClass = 'delay';
        return `
            <div class="mini-ms-item">
                <div class="mini-ms-left">
                    <span class="ms-dot ${dotClass}"></span>
                    <span>${m.name}</span>
                </div>
                <span class="mini-ms-date">${m.date}</span>
            </div>
        `;
    }).join('');
}